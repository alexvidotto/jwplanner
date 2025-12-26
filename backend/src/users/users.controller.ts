import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, HttpException, HttpStatus, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseGuards(AuthGuard) // Only Admins should create users
  async create(@Request() req, @Body() data: Prisma.ParticipanteCreateInput) {
    // TODO: explicit role check if needed
    try {
      return await this.usersService.createWithAuth(data);
    } catch (e: any) {
      // Return 400 Bad Request with the error message (e.g., "User already exists")
      throw new HttpException(e.message || String(e), HttpStatus.BAD_REQUEST);
    }
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

  @Post(':id/reset-password')
  @UseGuards(AuthGuard)
  async resetPassword(@Param('id') id: string) {
    try {
      return await this.usersService.resetPassword(id);
    } catch (e: any) {
      throw new HttpException(e.message || String(e), HttpStatus.BAD_REQUEST);
    }
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@Request() req, @Body() body: { password: string }) {
    if (!body.password || body.password.length < 6) {
      throw new HttpException('Password must be at least 6 characters', HttpStatus.BAD_REQUEST);
    }
    try {
      // req.user.id is the database ID (Participante ID) from AuthGuard
      return await this.usersService.changePassword(req.user.id, body.password);
    } catch (e: any) {
      throw new HttpException(e.message || String(e), HttpStatus.BAD_REQUEST);
    }
  }


  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Request() req, @Param('id') id: string) {
    // Check if user is trying to delete themselves (by ID or Authorization UID)
    if (req.user && (req.user.id === id || req.user.uidAuth === id)) {
      throw new HttpException('Cannot delete yourself', HttpStatus.FORBIDDEN);
    }
    try {
      return await this.usersService.delete(id);
    } catch (e: any) {
      throw new HttpException(e.message || String(e), HttpStatus.BAD_REQUEST);
    }
  }
}
