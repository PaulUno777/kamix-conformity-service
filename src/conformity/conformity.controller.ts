import { Controller, Post, Body, Param, Get, Res, StreamableFile, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { ConformityService } from './conformity.service';
import { FullName } from './dto/fullName.dto';

@Controller('conformity')
export class ConformityController {
  constructor(private readonly conformityService: ConformityService) {}

  @Post('checkSingle')
  checkSingle(@Body() body: FullName) {
    return this.conformityService.SingleCheck(body);
  }

  @Post('checkFile')
  checkFile(@Body() body: FullName) {
    return this.conformityService.test(body);
  }

  @ApiParam({name: 'fileName', required: true, description: 'tne name of file to daownload'})
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/xlsx')
  @Get('download/:file')
  async download(@Param('file') fileName, @Res() response: Response){
    const file = createReadStream(join(process.cwd(), 'public/'+fileName));
    file.pipe(response)
  }
}
