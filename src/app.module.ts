import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConformityModule } from './conformity/conformity.module';

@Module({
  imports: [ConformityModule, ConfigModule.forRoot({ isGlobal: true })],
  providers: [],
})
export class AppModule {}
