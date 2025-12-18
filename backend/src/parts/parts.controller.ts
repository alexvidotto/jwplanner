import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { PartsService } from './parts.service';
import { Prisma } from '@prisma/client';

@Controller('parts')
export class PartsController {
  constructor(private readonly partsService: PartsService) { }

  @Post()
  create(@Body() createPartDto: Prisma.ParteTemplateCreateInput) {
    return this.partsService.create(createPartDto);
  }

  @Get()
  findAll() {
    return this.partsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePartDto: Prisma.ParteTemplateUpdateInput) {
    return this.partsService.update(id, updatePartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partsService.remove(id);
  }
}
