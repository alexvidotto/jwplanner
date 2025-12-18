import { Controller, Post, Body, Get } from '@nestjs/common';
import { WeeksService } from './weeks.service';

@Controller('planning/weeks')
export class WeeksController {
  constructor(private readonly weeksService: WeeksService) { }

  @Post('generate')
  generate(@Body() body: { month: number; year: number }) {
    return this.weeksService.generateWeeks(body.month, body.year);
  }

  @Get()
  findAll() {
    return this.weeksService.findAll();
  }
}
