import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PlanningModule } from './planning/planning.module';
import { PartsModule } from './parts/parts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Explicit path
    }),
    UsersModule,
    PlanningModule,
    PartsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
