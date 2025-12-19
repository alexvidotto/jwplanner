import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Participante, Prisma, Privilegio } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InMemoryUsersRepository implements UsersRepository {
  async findHistory(userId: string): Promise<any[]> {
    return [];
  }

  private users: Participante[] = [];

  async create(data: Prisma.ParticipanteCreateInput): Promise<Participante> {
    const newUser: Participante = {
      id: uuidv4(),
      nome: data.nome,
      email: data.email || null,
      telefone: data.telefone || null,
      privilegio: data.privilegio || Privilegio.PUB_HOMEM,
      podeDesignar: data.podeDesignar ?? true,
      uidAuth: data.uidAuth || null,
    };
    this.users.push(newUser);
    return newUser;
  }

  async findAll(): Promise<Participante[]> {
    return this.users;
  }

  async findById(id: string): Promise<Participante | null> {
    return this.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<Participante | null> {
    return this.users.find((u) => u.email === email) || null;
  }

  async update(id: string, data: Prisma.ParticipanteUpdateInput): Promise<Participante> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');

    const updatedUser = { ...this.users[index] };
    if (data.nome) updatedUser.nome = data.nome as string;
    if (data.email) updatedUser.email = data.email as string;
    if (data.telefone) updatedUser.telefone = data.telefone as string;
    if (data.privilegio) updatedUser.privilegio = data.privilegio as Privilegio;

    this.users[index] = updatedUser;
    return updatedUser;
  }

  async updateSkillsBulk(updates: { id: string; abilities: string[] }[]): Promise<void> {
    updates.forEach(({ id, abilities }) => {
      const user = this.users.find((u) => u.id === id);
      // In-memory implementation doesn't support skills yet, just a placeholder to fix build
      if (user) {
        // user.abilities = abilities; // If we extended the type
      }
    });
  }
}
