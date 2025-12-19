import { Module } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { WeeksController } from './weeks.controller';
import { AssignmentsController } from './assignments.controller';
import { PrismaModule } from '../prisma/prisma.module';
// import { AssignmentsService } from './assignments.service';

@Module({
  imports: [PrismaModule],
  controllers: [WeeksController, AssignmentsController],
  providers: [WeeksService],
})
export class PlanningModule { }
