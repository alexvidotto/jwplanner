import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() data: Prisma.ParticipanteCreateInput) {
    return this.usersService.create(data);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('bulk-skills')
  async bulkUpdateSkills(@Body() body: { updates: { id: string; abilities: string[] }[] }) {
    await this.usersService.updateSkillsBulk(body.updates);
    return { success: true };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const { abilities, ...data } = body;

    if (abilities && Array.isArray(abilities)) {
      // Replace all existing skills with the new list
      data.habilidades = {
        deleteMany: {},
        create: abilities.map((ability: string) => {
          const isLeitor = ability.endsWith('_reader');
          const parteTemplateId = isLeitor ? ability.replace('_reader', '') : ability;
          return { parteTemplateId, isLeitor };
        }),
      };
    }

    return this.usersService.update(id, data);
  }
}
