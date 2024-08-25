import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderService } from './order.service';

@Module({
  imports: [PrismaModule,],
  controllers: [OrderController],
  providers: [OrderService]
})
export class OrderModule {}
