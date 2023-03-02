import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getHello() {
    return { message: 'Welcome to Kamix MemberCheck API!' };
  }
}
