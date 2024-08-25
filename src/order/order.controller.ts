import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from 'src/dtos/create-order.dto';
import { OrderStatusEnum } from 'src/common/enum/order-status.enum';

@Controller('order')
@ApiTags('Order')
@ApiBearerAuth()
export class OrderController {
    constructor(private service: OrderService){}

    @Get()    
    @ApiQuery({ name: 'customerName', required: false, type: String, example: 'smith' })
    @ApiQuery({ name: 'customerPhone', required: false, type: String, example: '789' })
    @ApiQuery({ name: 'minTotal', required: false, type: Number, example: 5 })
    @ApiQuery({ name: 'maxTotal', required: false, type: String, example: 100 })
    @ApiQuery({ name: 'status', required: false, type: String, example: OrderStatusEnum.CREATED })
    @ApiQuery({ name: 'order', required: false, type: String, example: '' })    
    @ApiQuery({ name: 'sort', required: false, type: Number, example: 1})    
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getOrders(
        @Query('customerName') customerName: string = '',
        @Query('customerPhone') customerPhone: string = '',
        @Query('minTotal') minTotal: number,
        @Query('maxTotal') maxTotal: number,
        @Query('status') status: OrderStatusEnum,
        @Query('order') order: string = '',
        @Query('sort') sort: number = 0,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,        
    ){
        return this.service.getOrders({customerName, customerPhone, minTotal, maxTotal, status, order, sort, page, limit})
    }

    @Get(':id')
    async getOrder(@Param('id', ParseIntPipe) id: number ){
        return this.service.getOrder(id);
    }

    @Post()
    async createOrder(@Body() input: CreateOrderDto){
        return this.service.createOrder(input)
    }
}
