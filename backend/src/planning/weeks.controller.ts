import { Controller, Post, Body, Get, Query, Put, Param } from '@nestjs/common';
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

  @Get('by-date')
  findByDate(@Query('date') date: string) {
    return this.weeksService.findByDate(date);
  }

  @Post()
  create(@Body() body: { date: string }) {
    return this.weeksService.createWeek(body.date);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.weeksService.update(id, body);
  }

  @Get(':weekId/suggestions/:partTemplateId')
  getSuggestions(
    @Param('weekId') weekId: string,
    @Param('partTemplateId') partTemplateId: string
  ) {
    return this.weeksService.getSuggestions(weekId, partTemplateId);
  }

  @Get('suggestions/by-date')
  getSuggestionsByDate(
    @Query('date') date: string,
    @Query('partTemplateId') partTemplateId: string
  ) {
    return this.weeksService.getSuggestions(date, partTemplateId);
  }
}
