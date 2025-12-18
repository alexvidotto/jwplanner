import { Injectable } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { Prisma, Participante } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) { }

  async create(data: Prisma.ParticipanteCreateInput): Promise<Participante> {
    return this.usersRepository.create(data);
  }

  async findAll(): Promise<Participante[]> {
    return this.usersRepository.findAll();
  }

  async findOne(id: string): Promise<Participante | null> {
    return this.usersRepository.findById(id);
  }

  async update(id: string, data: Prisma.ParticipanteUpdateInput): Promise<Participante> {
    return this.usersRepository.update(id, data);
  }
}
