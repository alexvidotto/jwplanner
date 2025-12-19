
import { Controller, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { WeeksService } from './weeks.service';

@Controller('planning/assignments')
export class AssignmentsController {
  constructor(private readonly weeksService: WeeksService) {}

  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    const assignment = await this.weeksService.findByToken(token);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  @Patch('token/:token/status')
  async updateStatus(
    @Param('token') token: string,
    @Body('status') status: 'CONFIRMADO' | 'RECUSADO' | 'PENDENTE'
  ) {
    const assignment = await this.weeksService.findByToken(token);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    return this.weeksService.updateStatusByToken(token, status);
  }
}
