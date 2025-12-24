import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await this.firebaseService.getAuth().verifyIdToken(token);

      // Fetch user from DB to get Role
      const user = await this.prisma.participante.findUnique({
        where: { uidAuth: decodedToken.uid },
      });

      if (!user) {
        // Option: Auto-create user or throw error. For strict role access, we might want to throw or assign default.
        // For now, let's attach the decoded token but with NO role if not found in DB?
        // Better: require DB presence for meaningful access.
        // But for initial login, maybe we need to relax this? 
        // Plan says: "Admins create users". So user SHOULD exist in DB with uidAuth if they have logged in.
        // If Admins create users, they might set uidAuth AFTER the user logs in for the first time?
        // No, Admins create users in Firebase AND DB. So link should be there.
        console.warn(`User with UID ${decodedToken.uid} not found in DB`);
      }

      request.user = user ? { ...user, uid: decodedToken.uid } : { ...decodedToken, role: 'USER' };
      return true;
    } catch (error) {
      console.error('Auth Guard Error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
