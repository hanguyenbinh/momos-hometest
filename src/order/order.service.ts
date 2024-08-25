import { Injectable } from '@nestjs/common';
import { contains, isEmpty, isNotEmpty, isNumber } from 'class-validator';
import { OrderStatusEnum } from 'src/common/enum/order-status.enum';
import { HttpResult } from 'src/common/http/http-result.http';
import { FiltersInterface } from 'src/common/interface/filters.interface';
import { CreateOrderDto } from 'src/dtos/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';


interface OrderFilters extends FiltersInterface {
    customerName: string;
    customerPhone: string;
    minTotal: number;
    maxTotal: number;
    status: OrderStatusEnum
}

@Injectable()
export class OrderService {
    constructor(private prismaService: PrismaService){}

    async getOrders(filters: OrderFilters){
        const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
        const skip = ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) - 1) * take;        
        const orderBy = {};
        const where: any = {}
        if (filters.order) {
            orderBy[filters.order] = 0 == filters.sort ? "asc" : "desc"
        }
        if (isNotEmpty(filters.customerName)){
            where.customer.name = {
                contains: filters.customerName
            }
        }
        if (isNotEmpty(filters.customerPhone)){
            where.customer.phone = {
                contains: filters.customerPhone
            }
        }
        if (isNotEmpty(filters.minTotal) && isNumber(filters.minTotal)){
            where.total = {
                gte: filters.minTotal
            }
        }
        if (isNotEmpty(filters.maxTotal) && isNumber(filters.maxTotal)){
            where.total = {
                lte: filters.maxTotal
            }
        }
        if (isNotEmpty(filters.status)){
            where.status = {
                equals: filters.status
            }
        }
        const result = await this.prismaService.order.findMany({
            skip,
            take,
            orderBy,
            where
        })
        return new HttpResult({
            message: 'GET_ORDER_SUCCESS',
            data: result
        })
    }

    async getOrder(id: number){
        const order = await this.prismaService.order.findUnique({
            where: {
                id
            }
        })
        if (isEmpty(order)) return new HttpResult({
            status: false,
            message: 'ORDER_NOT_FOUND'
        })
        return new HttpResult({
            message: 'GET_ORDER_SUCCESS',
            data: { order }
        })
    }

    async createOrder(input: CreateOrderDto){
        const goods = await this.prismaService.goods.findMany({
            where: {
                id: {
                    in: input.items
                }
            }
        })
        if (isEmpty(goods) || goods.length == 0){
            return new HttpResult({
                status: false,
                message: 'ITEMS_NOT_EXIST'
            })
        }
        let total = 0;
        goods.forEach(item => {
            total += parseFloat(item.unitPrice) /// need to findout why prisma store decimal type as string
        });
        const order = await this.prismaService.order.create({
            data: {...input, total}
        })
        return new HttpResult({
            status: true,
            message: 'CREATE_ORDER_SUCCESS',
            data: {order}
        })
    }
}
