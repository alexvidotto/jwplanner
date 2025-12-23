import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PlanningModule } from './planning/planning.module';
import { PartsModule } from './parts/parts.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Explicit path
    }),
    FirebaseModule,
    AuthModule,
    UsersModule,
    PlanningModule,
    PartsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
