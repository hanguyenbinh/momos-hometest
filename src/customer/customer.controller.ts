import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateCustomerDto } from 'src/dtos/create-customer.dto';

@Controller('customer')
@ApiTags('Customer')
@ApiBearerAuth()
export class CustomerController {
    constructor(private service: CustomerService){}

    @Get()
    @ApiQuery({ name: 'name', required: false, type: String, example: 'smith' })
    @ApiQuery({ name: 'phone', required: false, type: String, example: '789' })
    @ApiQuery({ name: 'order', required: false, type: String, example: '' })    
    @ApiQuery({ name: 'sort', required: false, type: Number, example: 1})    
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getCustomers(
        @Query('name') name: string = '',
        @Query('phone') phone: string = '',
        @Query('order') order: string = '',
        @Query('sort') sort: number = 0,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,        
    ){
        return this.service.getCustomers({name, phone, order, sort, page, limit})
    }

    @Get(':id')
    async getCustomer(@Param('id', ParseIntPipe) id: number ){
        return this.service.getCustomer(id);
    }

    @Post()
    async createCustomer(@Body() input: CreateCustomerDto){
        return this.service.createCustomer(input)
    }
}
