import { Participante, Prisma } from '@prisma/client';

export abstract class UsersRepository {
  abstract create(data: Prisma.ParticipanteCreateInput): Promise<Participante>;
  abstract findAll(): Promise<Participante[]>;
  abstract findById(id: string): Promise<Participante | null>;
  abstract findByEmail(email: string): Promise<Participante | null>;
  abstract update(id: string, data: Prisma.ParticipanteUpdateInput): Promise<Participante>;
  abstract updateSkillsBulk(updates: { id: string; abilities: string[] }[]): Promise<void>;
}
