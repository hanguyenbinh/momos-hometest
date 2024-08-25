import { Module } from '@nestjs/common';
import { GoodsController } from './goods.controller';
import { GoodsService } from './goods.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule,],
  controllers: [GoodsController],
  providers: [GoodsService]
})
export class GoodsModule {}
