import { Module } from '@nestjs/common';
import { ConformityService } from './conformity.service';
import { ConformityController } from './conformity.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ConformityController],
  providers: [ConformityService],
})
export class ConformityModule {}
