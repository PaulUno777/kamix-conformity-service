import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Res,
  HttpCode,
  HttpStatus,
  Header,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { of } from 'rxjs';
import { ConformityService } from './conformity.service';
import { FullName } from './dto/fullName.dto';
import * as fs from 'fs';

@Controller('conformity')
export class ConformityController {
  constructor(private readonly conformityService: ConformityService) {}

  @Post('check')
  checkSingle(@Body() body: FullName) {
    return this.conformityService.sheckSingle(body);
  }

  @Post('check/file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public',
        filename: async (req, file, cb) => {
          // Format File Name
          const fileName = basename(file.originalname).replace(/\s/g, '');
          //Calling the callback passing the name with the original extension name
          cb(null, `${fileName}`);
        }
      })
    }))
  async checkFile(@UploadedFile('file') file) {
    await this.conformityService.checkFile(file.filename);
    return of({ fileName: file.filename });
  }

  @ApiParam({
    name: 'fileName',
    required: true,
    description: 'the name of file to download',
  })
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'application/xlsx')
  @Get('download/:file')
  async download(@Param('file') fileName, @Res() response: Response) {
    const file = createReadStream(join(process.cwd(), 'public/' + fileName));
    file.pipe(response);
  }
}
