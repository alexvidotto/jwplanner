import { Controller, Get, Patch, Param, Body, NotFoundException, Request, UseGuards } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('planning/assignments')
export class AssignmentsController {
  constructor(private readonly weeksService: WeeksService) {}

  @Get('my-assignments')
  @UseGuards(AuthGuard)
  async getMyAssignments(@Request() req) {
    // AuthGuard populates req.user
    if (!req.user || !req.user.id) {
      // Should be blocked by guard, but safe check
      throw new NotFoundException('User context missing');
    }
    return this.weeksService.findAssignmentsByPersonId(req.user.id);
  }

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
    @Body('status') status: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE',
    @Body('personId') personId?: string
  ) {
    const assignment = await this.weeksService.findAssignmentById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return this.weeksService.updateAssignmentStatus(id, status, personId);
  }
}
