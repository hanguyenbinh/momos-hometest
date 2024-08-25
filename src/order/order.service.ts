import { Injectable } from '@nestjs/common';
import { isEmpty, isNotEmpty, isNumber } from 'class-validator';
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
    constructor(private prismaService: PrismaService) { }

    async getOrders(filters: OrderFilters) {
        const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
        const skip = ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) - 1) * take;
        const orderBy = {};
        const where: any = {}
        if (filters.order) {
            orderBy[filters.order] = 0 == filters.sort ? "asc" : "desc"
        }
        if (isNotEmpty(filters.customerName)) {
            where.customer.name = {
                contains: filters.customerName
            }
        }
        if (isNotEmpty(filters.customerPhone)) {
            where.customer.phone = {
                contains: filters.customerPhone
            }
        }
        if (isNotEmpty(filters.minTotal) && isNumber(filters.minTotal)) {
            where.total = {
                gte: filters.minTotal
            }
        }
        if (isNotEmpty(filters.maxTotal) && isNumber(filters.maxTotal)) {
            where.total = {
                lte: filters.maxTotal
            }
        }
        if (isNotEmpty(filters.status)) {
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

    async getOrder(id: number) {
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

    async createOrder(input: CreateOrderDto) {
        const goods = await this.prismaService.goods.findMany({
            where: {
                id: {
                    in: input.items.map(item => item.id)
                }
            }
        })
        if (isEmpty(goods) || goods.length == 0) {
            return new HttpResult({
                status: false,
                message: 'ITEMS_NOT_EXIST'
            })
        }
        let total = 0;
        let quantityChecking = true;
        const updateGoodsJobs = [];
        goods.forEach(item => {
            const found = input.items.find(elem => elem.id == item.id)
            if (found.quantity > item.quantity) {
                quantityChecking = false;
                return;
            }

            updateGoodsJobs.push(this.prismaService.goods.update({
                where: {
                    id: item.id
                },
                data: {
                    quantity: item.quantity - found.quantity
                }
            }))
            total += parseFloat(item.unitPrice.toString()) /// need to findout why prisma store decimal type as string
        });
        
        if (!quantityChecking) {
            return new HttpResult({
                status: false,
                message: "ITEM_QUANTITY_IS_INCORRECT"
            })
        }
        updateGoodsJobs.push( this.prismaService.order.create({
            data: {
                customerId: input.customerId,
                total,
                items: {
                    create: input.items.map(item=>{
                        return{
                            goods:{
                                connect: {
                                    id: item.id
                                }
                            },
                            quantity: item.quantity
                        }
                    })
                }

            }
        }))
        const result = await this.prismaService.$transaction(updateGoodsJobs);
        
        return new HttpResult({
            status: true,
            message: 'CREATE_ORDER_SUCCESS',
            data: {  order: result.pop()}
        })
    }
}
