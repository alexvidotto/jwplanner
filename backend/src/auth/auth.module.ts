import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { FirebaseModule } from '../firebase/firebase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [FirebaseModule, PrismaModule, ConfigModule],
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
