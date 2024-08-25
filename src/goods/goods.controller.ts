import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { GoodsService } from './goods.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateGoodsDto } from 'src/dtos/create-goods.dto';


@Controller('goods')
@ApiTags('Goods')
@ApiBearerAuth()
export class GoodsController {
    constructor(private service: GoodsService){}

    @Get()
    @ApiQuery({ name: 'name', required: false, type: String, example: 'bicycle' })
    @ApiQuery({ name: 'order', required: false, type: String, example: '' })    
    @ApiQuery({ name: 'sort', required: false, type: Number, example: 1})    
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getAllGoods(
        @Query('name') name: string = '',
        @Query('order') order: string = '',
        @Query('sort') sort: number = 0,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,        
    ){
        return this.service.getAllGoods({name, order, sort, page, limit})
    }

    @Get(':id')
    async getGoodsById(@Param('id', ParseIntPipe) id: number ){
        return this.service.getGoodsById(id);
    }

    @Post()
    async createGoods(@Body() input: CreateGoodsDto){
        return this.service.createGoods(input)
    }
}
