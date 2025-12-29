
import { Module } from '@nestjs/common';
import { WolService } from './wol.service';
import { WolController } from './wol.controller';

@Module({
  controllers: [WolController],
  providers: [WolService],
  exports: [WolService],
})
export class WolModule {}
