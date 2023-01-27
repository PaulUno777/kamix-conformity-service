import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class FullName {
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
}
