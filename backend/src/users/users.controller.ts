import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseGuards(AuthGuard) // Only Admins should create users
  async create(@Request() req, @Body() data: Prisma.ParticipanteCreateInput) {
    // TODO: explicit role check if needed, e.g. if (req.user.role !== 'ADMIN') throw ForbiddenException
    // For now, trusting the guard or will add role check soon.
    return this.usersService.createWithAuth(data);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Request() req) {
    return req.user;
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

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.usersService.getHistory(id);
  }

  @Post(':id/credentials')
  @UseGuards(AuthGuard)
  async createCredentials(@Param('id') id: string) {
    try {
      return await this.usersService.createCredentials(id);
    } catch (e: any) {
      throw new HttpException(e.message || String(e), HttpStatus.BAD_REQUEST);
    }
  }
}
