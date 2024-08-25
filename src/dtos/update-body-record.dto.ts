import { PartialType } from '@nestjs/swagger';
import { CreateBodyRecordDto } from './create-order.dto';

export class UpdateBodyRecordDto extends PartialType(CreateBodyRecordDto) { 
}
