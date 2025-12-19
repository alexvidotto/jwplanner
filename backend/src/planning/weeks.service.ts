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
      whereClause.privilegio = { in: ['ANCIAO', 'SERVO'] };
    } else if (partTemplateId === 'openingPrayer') {
      // Assuming any brother can do opening prayer if active
      // Or specifically PH? Usually any baptized brother.
      // Front-end filters by 'PH', so let's filter by gender related privileges if needed, 
      // or just trust the 'podeDesignar' + gender check on frontend.
      // But let's filter purely by gender implication if we can.
      // Actually, let's just NOT filter by 'habilidades' for these special roles.
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
          include: { semana: true },
          orderBy: { semana: { dataInicio: 'desc' } },
          // Fetch more history to analyze better
          take: 20
        },
        habilidades: true
      }
    });

    // 3. Process candidates to find specific history
    const processedCandidates = candidates.map(c => {
      // Find last time they did THIS specific part
      const lastSpecificAssignment = c.designacoes.find(d => d.parteTemplateId === partTemplateId);

      // Find last time they did ANY assignment
      const lastGeneralAssignment = c.designacoes[0];

      return {
        participant: c,
        lastAssignmentDate: lastSpecificAssignment?.semana?.dataInicio || null,
        lastGeneralAssignmentDate: lastGeneralAssignment?.semana?.dataInicio || null,
        // Helper for sorting: timestamp (0 if never)
        lastSpecificTs: lastSpecificAssignment?.semana?.dataInicio?.getTime() || 0,
        lastGeneralTs: lastGeneralAssignment?.semana?.dataInicio?.getTime() || 0
      };
    });

    // 4. Sort by last specific assignment (Oldest date first => smaller timestamp first? No, we want those who haven't done it for a long time.
    // So distinct logic: 
    // - Never done (ts=0) -> Priority 1
    // - Done long ago (small ts) -> Priority 2
    // - Done recently (large ts) -> Priority 3
    // So Ascending order of timestamp works! 0 comes first (never). Then 2020. Then 2024.

    return processedCandidates.sort((a, b) => {
      // Primary: Specific Part History
      if (a.lastSpecificTs !== b.lastSpecificTs) {
        return a.lastSpecificTs - b.lastSpecificTs;
      }
      // Secondary: General History (If tie on specific, prefer who hasn't worked recently at all)
      return a.lastGeneralTs - b.lastGeneralTs;
    }).map(item => {
      const p = item.participant as any;
      return {
        id: p.id,
        name: p.nome,
        type: p.privilegio,
        gender: (p.privilegio === 'PUB_MULHER') ? 'PM' : 'PH', // Basic inference
        active: p.podeDesignar,
        abilities: p.habilidades ? p.habilidades.map((h: any) => h.isLeitor ? `${h.parteTemplateId}_reader` : h.parteTemplateId) : [],
        lastAssignmentDate: item.lastAssignmentDate,
        lastGeneralAssignmentDate: item.lastGeneralAssignmentDate
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

    // Update Week fields (e.g. Presidente)
    if (data.presidentId !== undefined) {
      transaction.push(
        this.prisma.semana.update({
          where: { id },
          data: { presidenteId: data.presidentId }
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
