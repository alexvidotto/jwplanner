
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WolService } from './wol.service';

@Controller('wol')
export class WolController {
  constructor(private readonly wolService: WolService) {}

  @Get('content')
  async getWeekContent(@Query('date') date: string) {
    return this.wolService.fetchWeekContent(date);
  }
}
