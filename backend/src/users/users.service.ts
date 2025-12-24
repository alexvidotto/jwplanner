import { Injectable } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { Prisma, Participante } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly firebaseService: FirebaseService,
  ) { }

  async createWithAuth(data: Prisma.ParticipanteCreateInput & { role?: any }) {
    // 1. Generate random password
    const password = crypto.randomBytes(8).toString('hex');

    // 2. Create user in Firebase
    let uidAuth = '';
    try {
      const userRecord = await this.firebaseService.getAuth().createUser({
        email: data.email,
        password: password,
        displayName: data.nome,
      });
      uidAuth = userRecord.uid;
    } catch (error) {
      console.error('Error creating Firebase user:', error);
      throw error;
    }

    // 3. Create user in Postgres with uidAuth
    const user = await this.usersRepository.create({
      ...data,
      uidAuth,
    });

    return { user, password };
  }

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

  async updateSkillsBulk(updates: { id: string; abilities: string[] }[]): Promise<void> {
    return this.usersRepository.updateSkillsBulk(updates);
  }

  async getHistory(userId: string): Promise<any[]> {
    return this.usersRepository.findHistory(userId);
  }

  async createCredentials(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.uidAuth) {
      throw new Error('User already has credentials');
    }

    // 1. Generate random password
    const password = crypto.randomBytes(8).toString('hex');

    // 1.5 Ensure valid email
    let emailToUse = user.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToUse || !emailRegex.test(emailToUse)) {
      const sanitized = user.nome.toLowerCase().replace(/[^a-z0-9]/g, '');
      emailToUse = `${sanitized}@jwplanner.com.br`;

      // Update user with the generated email so it matches
      await this.usersRepository.update(userId, { email: emailToUse });
    }

    // 2. Create user in Firebase
    let uidAuth = '';
    try {
      // Check if user already exists in Firebase by email (edge case)
      try {
        const existingFirebaseUser = await this.firebaseService.getAuth().getUserByEmail(emailToUse);
        uidAuth = existingFirebaseUser.uid;
        // Optional: Update password if exists? Or throw?
        // Let's update password so the admin gets a valid one
        // Let's update password so the admin gets a valid one
        await this.firebaseService.getAuth().updateUser(uidAuth, { password });
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          const userRecord = await this.firebaseService.getAuth().createUser({
            email: emailToUse,
            password: password,
            displayName: user.nome,
          });
          uidAuth = userRecord.uid;
        } else {
          throw err;
        }
      }

      // Set custom claim to force password change
      await this.firebaseService.getAuth().setCustomUserClaims(uidAuth, { mustChangePassword: true });
    } catch (error) {
      console.error('Error creating/linking Firebase user:', error);
      throw error;
    }

    // 3. Update user in Postgres with uidAuth
    await this.usersRepository.update(userId, { uidAuth });

    return { email: emailToUse, password };
  }

  async resetPassword(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new Error('User not found');
    if (!user.uidAuth) throw new Error('User does not have credentials yet');

    // 1. Generate new password
    const password = crypto.randomBytes(8).toString('hex');

    // 2. Update in Firebase
    try {
      await this.firebaseService.getAuth().updateUser(user.uidAuth, { password });

      // Set custom claim to force password change
      await this.firebaseService.getAuth().setCustomUserClaims(user.uidAuth, { mustChangePassword: true });
    } catch (error) {
      console.error('Error resetting password in Firebase:', error);
      throw error;
    }

    return { email: user.email, password };
  }

  async changePassword(userId: string, newPassword: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new Error('User not found');
    if (!user.uidAuth) throw new Error('User does not have credentials');

    try {
      await this.firebaseService.getAuth().updateUser(user.uidAuth, { password: newPassword });
      // Remove the custom claim
      await this.firebaseService.getAuth().setCustomUserClaims(user.uidAuth, { mustChangePassword: null });
    } catch (error) {
      console.error('Error changing password in Firebase:', error);
      throw error;
    }

    return { success: true };
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new Error('User not found');

    // 1. Delete from Firebase if exists
    if (user.uidAuth) {
      try {
        await this.firebaseService.getAuth().deleteUser(user.uidAuth);
      } catch (error: any) {
        console.warn(`Failed to delete Firebase user ${user.uidAuth}:`, error.message);
        // Continue to unlink in DB
      }
    }

    // 2. Unlink from DB (Keep the participant, just remove access)
    await this.usersRepository.update(id, {
      uidAuth: null,
      role: 'USER', // Reset role to basic user
      // We keep the email so they can be re-invited or linked again later if needed
      // ensuring we don't lose their contact info if it was real.
      // If the email was generated, it stays there, which is fine.
    });

    return { success: true };
  }
}
