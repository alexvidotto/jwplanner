import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ParteTemplate } from '@prisma/client';

@Injectable()
export class PartsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: Prisma.ParteTemplateCreateInput): Promise<ParteTemplate> {
    return this.prisma.parteTemplate.create({ data });
  }

  async findAll(): Promise<ParteTemplate[]> {
    return this.prisma.parteTemplate.findMany();
  }

  async findOne(id: string): Promise<ParteTemplate | null> {
    return this.prisma.parteTemplate.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.ParteTemplateUpdateInput): Promise<ParteTemplate> {
    return this.prisma.parteTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<ParteTemplate> {
    return this.prisma.parteTemplate.delete({ where: { id } });
  }

  async getPartHistory(partId: string): Promise<any[]> {
    return this.prisma.designacao.findMany({
      where: { parteTemplateId: partId },
      include: {
        semana: true,
        titular: true,
        ajudante: true
      },
      orderBy: { semana: { dataInicio: 'desc' } }, // Newest first
      take: 20
    });
  }
}
