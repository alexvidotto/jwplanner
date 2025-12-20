
import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { WeeksService } from './weeks.service';

@Controller('planning/assignments')
export class AssignmentsController {
  constructor(private readonly weeksService: WeeksService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    const assignment = await this.weeksService.findAssignmentById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE'
  ) {
    const assignment = await this.weeksService.findAssignmentById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return this.weeksService.updateAssignmentStatus(id, status);
  }
}
