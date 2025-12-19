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

  async getSuggestions(weekId: string, partTemplateId: string) {
    const week = await this.prisma.semana.findUnique({ where: { id: weekId } });
    if (!week) return [];

    // 1. Find candidates with the skill
    const candidates = await this.prisma.participante.findMany({
      where: {
        habilidades: {
          some: {
            parteTemplateId: partTemplateId
          }
        },
        podeDesignar: true,
        // 2. Filter unavailability
        indisponibilidades: {
          none: {
            dataInicio: { lte: week.dataInicio }, // Logic simplification: checks if unavailable range overlaps week start
            dataFim: { gte: week.dataInicio }
          }
        }
      },
      include: {
        designacoes: {
          include: { semana: true },
          orderBy: { semana: { dataInicio: 'desc' } },
          take: 1
        }
      }
    });

    // 3. Sort by last assignment (oldest first)
    return candidates.sort((a, b) => {
      const lastA = a.designacoes[0]?.semana?.dataInicio?.getTime() || 0;
      const lastB = b.designacoes[0]?.semana?.dataInicio?.getTime() || 0;
      return lastA - lastB;
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
