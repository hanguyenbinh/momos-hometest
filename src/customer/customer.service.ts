import { Injectable } from '@nestjs/common';
import { isNotEmpty } from 'class-validator';
import { HttpResult } from 'src/common/http/http-result.http';
import { FiltersInterface } from 'src/common/interface/filters.interface';
import { CreateCustomerDto } from 'src/dtos/create-customer.dto';
import { PrismaService } from 'src/prisma/prisma.service';


interface CustomerFilters extends FiltersInterface {
    name: string;
    phone: string
}

@Injectable()
export class CustomerService {
    constructor(private prismaService:PrismaService){}

    async getCustomers(filters: CustomerFilters){
        const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
        const skip = ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) - 1) * take;        
        const orderBy = {};
        const where: any = {}
        if (filters.order) {
            orderBy[filters.order] = 0 == filters.sort ? "asc" : "desc"
        }
        if (isNotEmpty(filters.name)){
            where.name = {
                contains: filters.name
            }
        }   
        if (isNotEmpty(filters.phone)){
            where.phone = {
                contains: filters.phone
            }
        }  
        const result = await this.prismaService.customer.findMany({
            skip,
            take,
            orderBy,
            where
        })
        return new HttpResult({
            message: 'GET_CUSTOMERS_SUCCESS',
            data: result
        })
    }

    async getCustomer(id: number) {
        const goods = await this.prismaService.customer.findUnique({
            where: {
                id
            }
        })
        if (!goods) return new HttpResult({
            status: false,
            message: 'CUSTOMER_NOT_FOUND'
        })
        return new HttpResult({
            message: 'GET_CUSTOMER_SUCCESS',
            data: { goods }
        })
    }

    async createCustomer(input:CreateCustomerDto){
        const goods = await this.prismaService.customer.create({
            data: input
        })
        return new HttpResult({
            message: 'CREATE_CUSTOMER_SUCCESS',
            data: {goods}
        })
    }
}
