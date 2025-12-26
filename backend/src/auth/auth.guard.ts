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
        console.warn(`User with UID ${decodedToken.uid} not found in DB`);
      }

      request.user = user ? { ...user, uid: decodedToken.uid } : { ...decodedToken, role: 'USER' };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
