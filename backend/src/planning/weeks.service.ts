import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WeeksService {
  // Logic for week generation and management
  async generateWeeks(month: number, year: number) {
    const weeks = [];
    const date = new Date(year, month - 1, 1);

    // Find first Monday
    while (date.getDay() !== 1) {
      date.setDate(date.getDate() + 1);
    }

    // Get all part templates
    const templates = await this.prisma.parteTemplate.findMany();

    // Loop through Mondays of the month
    while (date.getMonth() === month - 1) {
      const dataInicio = new Date(date);
      const descricao = this.formatWeekDescription(date);

      // Check if week exists
      let week = await this.prisma.semana.findFirst({
        where: { dataInicio: dataInicio }
      });

      if (!week) {
        week = await this.prisma.semana.create({
          data: {
            dataInicio: dataInicio,
            descricao: descricao,
            tipo: 'NORMAL',
            designacoes: {
              create: templates.map((tpl, idx) => ({
                parteTemplateId: tpl.id,
                tempo: tpl.tempoPadrao || 5,
                status: 'PENDENTE',
                ordem: idx,

              }))
            }
          },
          include: { designacoes: true }
        });
      }

      weeks.push(week);
      date.setDate(date.getDate() + 7);
    }

    return weeks;
  }

  async findAll() {
    return this.prisma.semana.findMany({
      orderBy: { dataInicio: 'asc' },
      include: {
        designacoes: {
          include: {
            parteTemplate: true,
            titular: true,
            ajudante: true
          },
          orderBy: { ordem: 'asc' } // Sort by custom order
        }
      }
    });
  }

  private formatWeekDescription(start: Date): string {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = start.toLocaleString('default', { month: 'long' });
    const endMonth = end.toLocaleString('default', { month: 'long' });

    if (start.getMonth() === end.getMonth()) {
      return `${startDay}-${endDay} de ${month}`;
    } else {
      return `${startDay} de ${month} - ${endDay} de ${endMonth}`;
    }
  }

  constructor(private readonly prisma: PrismaService) { }

  async getSuggestions(weekIdentifier: string, partTemplateId: string) {
    let week;
    const isDate = !isNaN(Date.parse(weekIdentifier)) && weekIdentifier.includes('-'); // Simple check

    if (isDate) {
      week = { dataInicio: new Date(weekIdentifier) };
    } else {
      week = await this.prisma.semana.findUnique({ where: { id: weekIdentifier } });
    }

    if (!week) return [];

    // 1. Find candidates with the skill
    let whereClause: any = {
      podeDesignar: true
    };

    if (partTemplateId === 'president') {
      whereClause.privilegio = { in: ['ANCIAO'] }; // Usually only Elders
    } else if (partTemplateId === 'openingPrayer') {
      whereClause.privilegio = { in: ['ANCIAO', 'SERVO', 'PUB_HOMEM'] };
    } else {
      whereClause.habilidades = {
        some: {
          parteTemplateId: partTemplateId
        }
      };
    }

    const candidates = await this.prisma.participante.findMany({
      where: whereClause,
      include: {
        designacoes: {
          include: {
            semana: true,
            parteTemplate: true
          },
          orderBy: { semana: { dataInicio: 'desc' } },
          where: {
            semana: { id: { not: week.id } } // Exclude current week only
          },
          take: 5 // Get last 5 to show history
        },
        ajudas: {
          include: {
            semana: true,
            parteTemplate: true
          },
          orderBy: { semana: { dataInicio: 'desc' } },
          where: {
            semana: { id: { not: week.id } }
          },
          take: 5
        },
        habilidades: true
      }
    });

    // Handle President History specially since it's on Semana model
    let presidenciesMap = new Map<string, any[]>();
    if (partTemplateId === 'president') {
      const candidateIds = candidates.map(c => c.id);

      const pastPresidencies = await this.prisma.semana.findMany({
        where: {
          presidenteId: { in: candidateIds },
          id: { not: week.id }
        },
        orderBy: { dataInicio: 'desc' },
        take: 100 // Enough to cover recent history for everyone
      });

      pastPresidencies.forEach(p => {
        if (p.presidenteId) {
          if (!presidenciesMap.has(p.presidenteId)) {
            presidenciesMap.set(p.presidenteId, []);
          }
          presidenciesMap.get(p.presidenteId)?.push({
            date: p.dataInicio,
            role: 'Pre',
            title: 'Presidente'
          });
        }
      });
    }

    // 3. Process candidates to find specific history
    const processedCandidates = candidates.map(c => {
      let lastSpecificTs = 0;
      let lastGeneralTs = 0;

      // Merge all sources of history: Presidencies + Designacoes (Titular) + Ajudas (Ajudante)
      // Note: 'ajudas' explicitly means they were the assistant.

      const presidentsHistory = (partTemplateId === 'president' ? (presidenciesMap.get(c.id) || []) : []).map(p => ({
        date: p.date,
        role: 'PRESIDENTE',
        title: 'Presidente',
        isSpecific: true // Always specific for President role
      }));

      const titularHistory = c.designacoes.map(d => ({
        date: d.semana.dataInicio,
        role: 'TITULAR',
        title: d.parteTemplate?.titulo || 'Desconhecido',
        isSpecific: d.parteTemplateId === partTemplateId
      }));

      const assistantHistory = c.ajudas.map(d => ({
        date: d.semana.dataInicio,
        role: d.parteTemplate?.requerLeitor ? 'LEITOR' : 'AJUDANTE',
        title: d.parteTemplate?.titulo || 'Desconhecido',
        isSpecific: d.parteTemplateId === partTemplateId
      }));

      const allHistory = [
        ...presidentsHistory,
        ...titularHistory,
        ...assistantHistory
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calculate last assignment timestamps for sorting
      if (allHistory.length > 0) {
        lastGeneralTs = allHistory[0].date.getTime();

        // Find most recent SPECIFIC assignment
        const specific = allHistory.find(h => h.isSpecific);
        if (specific) {
          lastSpecificTs = specific.date.getTime();
        }
      }

      // Slice for display
      const history = allHistory.slice(0, 3);

      return {
        ...c,
        lastAssignmentDate: lastSpecificTs > 0 ? new Date(lastSpecificTs).toISOString() : null,
        lastGeneralAssignmentDate: lastGeneralTs > 0 ? new Date(lastGeneralTs).toISOString() : null,
        lastSpecificTs, // Keep for sorting
        lastGeneralTs,  // Keep for sorting
        history
      };
    });

    // 4. Sort
    return processedCandidates.sort((a, b) => {
      // Primary: Specific Part History (Ascending: older is better/more available)
      // If never assigned (0), it's "better" than recently assigned.
      // But wait, standard logic: Least recently assigned first. 0 means never assigned, so it should be first.

      // If A has never done it (0) and B has (timestamp), A comes first.
      // If both have done it, smaller timestamp (older) comes first.

      // Let's assume 0 is "Long ago" (effectively).

      // Wait, if I use a.lastSpecificTs - b.lastSpecificTs:
      // A=0, B=Time. 0 - Time = Negative. A comes first. Correct.
      // A=OldTime, B=NewTime. Old - New = Negative. A comes first. Correct.

      if (a.lastSpecificTs !== b.lastSpecificTs) {
        return a.lastSpecificTs - b.lastSpecificTs;
      }

      // Secondary: General History
      return a.lastGeneralTs - b.lastGeneralTs;
    }).map(item => {
      // item is the flattened participant with extra fields
      return {
        id: item.id,
        name: item.nome,
        type: item.privilegio,
        gender: (item.privilegio === 'PUB_MULHER') ? 'PM' : 'PH',
        active: item.podeDesignar,
        abilities: item.habilidades ? item.habilidades.map((h: any) => h.isLeitor ? `${h.parteTemplateId}_reader` : h.parteTemplateId) : [],
        lastAssignmentDate: item.lastAssignmentDate,
        lastGeneralAssignmentDate: item.lastGeneralAssignmentDate,
        history: item.history
      };
    });
  }

  async findByDate(date: string) {
    // Ensure date is ISO-8601 or YYYY-MM-DD
    const start = new Date(date);
    return this.prisma.semana.findFirst({
      where: { dataInicio: start },
      include: {
        designacoes: {
          include: {
            parteTemplate: true,
            titular: true,
            ajudante: true
          },
          orderBy: { ordem: 'asc' }
        }
      }
    });
  }

  async findByRange(startDate: string, endDate: string) {
    return this.prisma.semana.findMany({
      where: {
        dataInicio: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { dataInicio: 'asc' },

      include: {
        presidente: true,
        designacoes: {
          include: {
            parteTemplate: true,
            titular: true,
            ajudante: true
          },
          orderBy: { ordem: 'asc' }
        }
      }
    });
  }

  async createWeek(date: string) {
    const start = new Date(date);
    const templates = await this.prisma.parteTemplate.findMany();
    const descricao = this.formatWeekDescription(start);

    return this.prisma.semana.create({
      data: {
        dataInicio: start,
        descricao,
        tipo: 'NORMAL',
        designacoes: {
          create: templates.map((tpl, idx) => ({
            parteTemplateId: tpl.id,
            tempo: tpl.tempoPadrao || 5,
            status: 'PENDENTE',
            ordem: idx,

          }))
        }
      },
      include: {
        designacoes: {
          include: {
            parteTemplate: true,
            titular: true,
            ajudante: true
          }
        }
      }
    });

  }

  async update(id: string, data: any) {
    const transaction = [];

    // Update Week fields (e.g. Presidente, Tipo)
    const weekDataToUpdate: any = {};
    if (data.presidentId !== undefined) weekDataToUpdate.presidenteId = data.presidentId;
    if (data.presidentStatus !== undefined) weekDataToUpdate.statusPresidente = data.presidentStatus;
    if (data.openingPrayerStatus !== undefined) weekDataToUpdate.statusOracao = data.openingPrayerStatus;
    if (data.tipo !== undefined) weekDataToUpdate.tipo = data.tipo;
    if (data.descricao !== undefined) weekDataToUpdate.descricao = data.descricao;

    if (Object.keys(weekDataToUpdate).length > 0) {
      transaction.push(
        this.prisma.semana.update({
          where: { id },
          data: weekDataToUpdate
        })
      );
    }
    // Sync statusOracao with Designacao if exists
    if (data.openingPrayerStatus !== undefined) {
      const prayerDesignation = await this.prisma.designacao.findFirst({
        where: {
          semanaId: id,
          parteTemplate: {
            titulo: 'Oração Inicial'
          }
        }
      });
      if (prayerDesignation) {
        transaction.push(
          this.prisma.designacao.update({
            where: { id: prayerDesignation.id },
            data: { status: data.openingPrayerStatus }
          })
        );
      }
    }
    // Update Designations
    // We expect data.designacoes to be an array of updates
    // Update Designations with Sync Logic (Delete missing, Create new, Update existing)
    if (data.designacoes && Array.isArray(data.designacoes)) {
      // 1. Get current designations to identify what to delete
      const currentDesignations = await this.prisma.designacao.findMany({
        where: { semanaId: id },
        select: { id: true }
      });
      const currentIds = currentDesignations.map(d => d.id);

      // 2. Identify incoming IDs (exclude temporary IDs like 'new-' or 'virtual-')
      // Actually, we process all incoming. If ID is 'new-' or 'virtual-', it's a create.
      // If ID is a UUID but present in incoming, it's update.
      // If ID is in currentIds but NOT in incoming, it's delete.

      const incomingIds = data.designacoes
        .map((d: any) => d.id)
        .filter((id: string) => !id.startsWith('new-') && !id.startsWith('virtual-') && currentIds.includes(id));

      const idsToDelete = currentIds.filter(id => !incomingIds.includes(id));

      // 3. Delete missing
      if (idsToDelete.length > 0) {
        transaction.push(
          this.prisma.designacao.deleteMany({
            where: { id: { in: idsToDelete } }
          })
        );
      }

      // 4. Update or Create
      data.designacoes.forEach((d: any) => {
        const isNew = d.id.startsWith('new-') || d.id.startsWith('virtual-') || !currentIds.includes(d.id);

        if (isNew) {
          // Create
          transaction.push(
            this.prisma.designacao.create({
              data: {
                semanaId: id,
                parteTemplateId: d.parteTemplateId,
                titularId: d.assignedTo || null,
                ajudanteId: d.assistantId || null,
                status: d.status || 'PENDENTE',
                statusAjudante: d.assistantStatus || d.readerStatus || 'PENDENTE',
                ordem: d.ordem !== undefined ? d.ordem : 0,
                observacao: d.observation,
                tituloDoTema: d.tituloDoTema,
                tempo: d.tempo,

              }
            })
          );
        } else {
          // Update
          transaction.push(
            this.prisma.designacao.update({
              where: { id: d.id },
              data: {
                titularId: d.assignedTo || null,
                ajudanteId: d.assistantId || null,
                status: d.status,
                statusAjudante: d.assistantStatus || d.readerStatus,
                ordem: d.ordem !== undefined ? d.ordem : undefined,
                observacao: d.observation,
                tituloDoTema: d.tituloDoTema,
                tempo: d.tempo,
              }
            })
          );
        }
      });
    }

    if (transaction.length > 0) {
      await this.prisma.$transaction(transaction);
    }

    return this.prisma.semana.findUnique({
      where: { id },
      include: {
        designacoes: {
          include: {
            parteTemplate: true,
            titular: true,
            ajudante: true
          },
          orderBy: { ordem: 'asc' }
        }
      }
    });
  }

  async findAssignmentById(id: string) {
    // Check for special Week assignments (President, Prayer)
    if (id.startsWith('week-')) {
      // Regex to match week-<UUID>-<role>
      // UUID is roughly 36 chars. Role is president or prayer.
      const match = id.match(/^week-(.+)-(president|prayer)$/);

      if (match) {
        const weekId = match[1];
        const role = match[2]; // 'president' or 'prayer'

        const week = await this.prisma.semana.findUnique({ where: { id: weekId } });
        if (!week) return null;

        let participantId = null;
        let status = 'PENDENTE';
        let title = '';

        if (role === 'president') {
          participantId = week.presidenteId;
          status = week.statusPresidente;
          title = 'Presidente';
        } else if (role === 'prayer') {
          participantId = week.oracaoId;
          status = week.statusOracao;
          title = 'Oração Inicial';
        }

        if (!participantId) return null;

        const participant = await this.prisma.participante.findUnique({ where: { id: participantId } });

        // Construct a virtual Assignment object
        return {
          id: id,
          semana: week,
          status: status,
          parteTemplate: {
            titulo: title,
            secao: 'Geral',
            tempoPadrao: role === 'prayer' ? 5 : null
          },
          titular: participant,
          ajudante: null,
          observacao: null,
          tempo: role === 'prayer' ? 5 : null,
          tituloDoTema: null
        };
      }
    }

    return this.prisma.designacao.findUnique({
      where: { id },
      include: {
        semana: true,
        parteTemplate: true,
        titular: true,
        ajudante: true
      }
    });
  }

  async updateAssignmentStatus(id: string, status: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE', personId?: string) {
    // Check for special Week assignments
    if (id.startsWith('week-')) {
      const match = id.match(/^week-(.+)-(president|prayer)$/);
      if (match) {
        const weekId = match[1];
        const role = match[2];

        const data: any = {};
        if (role === 'president') {
          data.statusPresidente = status;
        } else if (role === 'prayer') {
          data.statusOracao = status;
        }

        return this.prisma.semana.update({
          where: { id: weekId },
          data: data
        });
      }
    }

    // Identify which field to update based on personId
    const assignment = await this.prisma.designacao.findUnique({ where: { id } });
    if (!assignment) return null; // Should be handled by controller, but safe check

    const data: any = {};

    if (personId) {
      if (assignment.ajudanteId === personId) {
        data.statusAjudante = status;
      } else if (assignment.titularId === personId) {
        data.status = status;
      } else {
        // Fallback: if personId doesn't match either, maybe it's an admin forcing update?
        // Or maybe we should default to updating 'status' (titular) if ambiguous?
        // Let's assume matches titular OR default to titular if null.
        // But if provided and NO match, better not update wrong one?
        // Use titular as default for backward compatibility.
        data.status = status;
      }
    } else {
      // Default to Titular status if no personId provided (legacy behavior)
      data.status = status;
    }

    return this.prisma.designacao.update({
      where: { id },
      data: data
    });
  }

  async getSmartSuggestionsData() {
    // 0. Fetch President and Prayer Template IDs
    const presidentTemplate = await this.prisma.parteTemplate.findFirst({
      where: { titulo: 'Presidente' }
    });
    const presidentPartId = presidentTemplate?.id || 'president';

    const prayerTemplate = await this.prisma.parteTemplate.findFirst({
      where: { titulo: 'Oração Inicial' }
    });
    const prayerPartId = prayerTemplate?.id || 'prayer';

    // 1. Fetch all participants with their skills
    const users = await this.prisma.participante.findMany({
      include: { habilidades: true },
      where: { podeDesignar: true } // Only active users
    });

    // 2. Fetch all historical assignments
    const assignments = await this.prisma.designacao.findMany({
      where: {
        status: { not: 'RECUSADO' } // Ignore refused assignments
      },
      include: {
        semana: true,
        parteTemplate: true
      },
      orderBy: { semana: { dataInicio: 'desc' } }
    });

    // Also fetch presidencies and prayers from Week table
    const weekAssignments = await this.prisma.semana.findMany({
      where: {
        OR: [
          { presidenteId: { not: null }, statusPresidente: { not: 'RECUSADO' } },
          { oracaoId: { not: null }, statusOracao: { not: 'RECUSADO' } }
        ]
      },
      orderBy: { dataInicio: 'desc' },
      select: {
        presidenteId: true,
        oracaoId: true,
        dataInicio: true
      }
    });

    // 3. Compute Map: UserId -> { PartId -> LastDate }
    const historyMap = new Map<string, Map<string, string>>();

    // Helper to set date
    const setLastDate = (userId: string, partId: string, date: Date) => {
      if (!historyMap.has(userId)) {
        historyMap.set(userId, new Map());
      }
      const userHistory = historyMap.get(userId)!;
      // Since we iterate DESC, first time we see a pair is the latest
      if (!userHistory.has(partId)) {
        userHistory.set(partId, date.toISOString());
      }
    };

    // Process Week Assignments (President/Prayer)
    weekAssignments.forEach(p => {
      if (p.presidenteId) {
        setLastDate(p.presidenteId, presidentPartId, p.dataInicio);
      }
      if (p.oracaoId) {
        setLastDate(p.oracaoId, prayerPartId, p.dataInicio);
      }
    });

    // Process Assignments
    assignments.forEach(a => {
      if (a.titularId) {
        setLastDate(a.titularId, a.parteTemplateId, a.semana.dataInicio);
      }
      if (a.ajudanteId) {
        if (a.parteTemplate?.requerLeitor) {
          setLastDate(a.ajudanteId, `${a.parteTemplateId}_reader`, a.semana.dataInicio);
        } else {
          // Generic assistant (for FSM parts mostly)
          setLastDate(a.ajudanteId, `${a.parteTemplateId}_assistant`, a.semana.dataInicio);
        }
      }
    });

    // 4. Build Result
    return users.map(u => {
      const userHistory = historyMap.get(u.id);
      const historyObj: any = {};

      if (userHistory) {
        userHistory.forEach((date, partId) => {
          historyObj[partId] = date;
        });
      }

      return {
        id: u.id,
        name: u.nome,
        privilege: u.privilegio,
        skills: u.habilidades.map(h => h.isLeitor ? `${h.parteTemplateId}_reader` : h.parteTemplateId),
        history: historyObj
      };
    });
  }

  async findAssignmentsByPersonId(personId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch Assignments (Titular/Ajudante)
    const assignments = await this.prisma.designacao.findMany({
      where: {
        OR: [
          { titularId: personId },
          { ajudanteId: personId }
        ],
        semana: {
          dataInicio: {
            gte: today
          }
        }
      },
      include: {
        semana: true,
        parteTemplate: true,
        titular: { select: { id: true, nome: true } },
        ajudante: { select: { id: true, nome: true } }
      },
      orderBy: { semana: { dataInicio: 'asc' } }
    });

    // 2. Fetch Week Roles (President/Prayer)
    const weekRoles = await this.prisma.semana.findMany({
      where: {
        OR: [
          { presidenteId: personId },
          { oracaoId: personId }
        ],
        dataInicio: {
          gte: today
        }
      },
      orderBy: { dataInicio: 'asc' }
    });

    // 3. Normalize and Combine
    const normalizedAssignments = [];

    for (const a of assignments) {
      let role = 'TITULAR';
      let status = a.status;

      if (a.ajudanteId === personId) {
        role = a.parteTemplate.requerLeitor ? 'LEITOR' : 'AJUDANTE';
        status = a.statusAjudante;
      }

      normalizedAssignments.push({
        id: a.id,
        date: a.semana.dataInicio,
        weekDescription: a.semana.descricao,
        partTitle: a.parteTemplate.titulo,
        themeTitle: a.tituloDoTema,
        role: role,
        status: status,
        observations: a.observacao,
        partner: role === 'TITULAR' ? a.ajudante?.nome : a.titular?.nome,
        partnerRole: role === 'TITULAR' ? (a.parteTemplate.requerLeitor ? 'Leitor' : 'Ajudante') : 'Titular',
        time: a.tempo,
        requiresAssistant: a.parteTemplate.requerAjudante,
        requiresReader: a.parteTemplate.requerLeitor,
        hasTime: a.parteTemplate.titulo === 'Oração Inicial' ? false : a.parteTemplate.temTempo
      });
    }

    for (const w of weekRoles) {
      if (w.presidenteId === personId) {
        normalizedAssignments.push({
          id: `week-${w.id}-president`,
          date: w.dataInicio,
          weekDescription: w.descricao,
          partTitle: 'Presidente',
          themeTitle: null,
          role: 'PRESIDENTE',
          status: w.statusPresidente,
          observations: null,
          partner: null,
          partnerRole: null,
          time: null,
          requiresAssistant: false,
          requiresReader: false,
          hasTime: false
        });
      }
      if (w.oracaoId === personId) {
        normalizedAssignments.push({
          id: `week-${w.id}-prayer`,
          date: w.dataInicio,
          weekDescription: w.descricao,
          partTitle: 'Oração Inicial',
          themeTitle: null,
          role: 'ORAÇÃO',
          status: w.statusOracao,
          observations: null,
          partner: null,
          partnerRole: null,
          time: 5,
          requiresAssistant: false,
          requiresReader: false,
          hasTime: false
        });
      }
    }

    // Sort combined list by date
    return normalizedAssignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
