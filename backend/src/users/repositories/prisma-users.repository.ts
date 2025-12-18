import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersRepository } from './users.repository';
import { Prisma, Participante, Privilegio } from '@prisma/client';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: Prisma.ParticipanteCreateInput): Promise<Participante> {
    return this.prisma.participante.create({
      data: {
        ...data,
        privilegio: data.privilegio || Privilegio.PUB_HOMEM, // Default if not provided
        podeDesignar: data.podeDesignar ?? true,
      },
    });
  }

  async findAll(): Promise<Participante[]> {
    return this.prisma.participante.findMany({
      orderBy: { nome: 'asc' },
      include: { habilidades: true },
    });
  }

  async findById(id: string): Promise<Participante | null> {
    return this.prisma.participante.findUnique({
      where: { id },
      include: { habilidades: true },
    });
  }

  async findByEmail(email: string): Promise<Participante | null> {
    return this.prisma.participante.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Prisma.ParticipanteUpdateInput): Promise<Participante> {
    return this.prisma.participante.update({
      where: { id },
      data,
      include: { habilidades: true },
    });
  }

  async updateSkillsBulk(updates: { id: string; abilities: string[] }[]): Promise<void> {
    await this.prisma.$transaction(
      updates.map(({ id, abilities }) =>
        this.prisma.participante.update({
          where: { id },
          data: {
            habilidades: {
              deleteMany: {},
              create: abilities.map((ability) => {
                const isLeitor = ability.endsWith('_reader');
                const parteTemplateId = isLeitor ? ability.replace('_reader', '') : ability;
                return {
                  parteTemplateId,
                  isLeitor
                };
              }),
            },
          },
        })
      )
    );
  }
}
