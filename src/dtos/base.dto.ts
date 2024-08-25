import { ApiHideProperty } from '@nestjs/swagger';

export abstract class BaseDto {
  @ApiHideProperty()
  createdBy: number;

  @ApiHideProperty()
  createdAt: Date;

  @ApiHideProperty()
  updatedBy: number;

  @ApiHideProperty()
  updatedAt: Date;

  @ApiHideProperty()
  deletedBy: number;

  @ApiHideProperty()
  userId: number;

  @ApiHideProperty()
  deletedAt: Date;
}
