import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
                ordem: idx
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
      podeDesignar: true,
      indisponibilidades: {
        none: {
          dataInicio: { lte: week.dataInicio },
          dataFim: { gte: week.dataInicio }
        }
      }
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
        title: d.parteTemplate.titulo,
        isSpecific: d.parteTemplateId === partTemplateId
      }));

      const assistantHistory = c.ajudas.map(d => ({
        date: d.semana.dataInicio,
        role: d.parteTemplate.requerLeitor ? 'LEITOR' : 'AJUDANTE',
        title: d.parteTemplate.titulo,
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
            ordem: idx
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
}
