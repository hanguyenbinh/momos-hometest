import { Injectable } from '@nestjs/common';
import { isEmpty, isNotEmpty, isNumber } from 'class-validator';
import { OrderStatusEnum } from 'src/common/enum/order-status.enum';
import { HttpResult } from 'src/common/http/http-result.http';
import { FiltersInterface } from 'src/common/interface/filters.interface';
import { CreateOrderDto } from 'src/dtos/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client'



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
        console.log(filters)
        const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
        const skip = ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) - 1) * take;
        const orderBy: any = {};
        const where: any = {}
        if (filters.order) {
            const sort = 'asc' == filters.sort ? "asc" : "desc";
            if (filters.order == 'customerName') {
                orderBy.customer = {
                    name: sort
                };
            }
            else if (filters.order == 'customerPhone') {
                orderBy.customer = { phone: sort };
            }
            else
                orderBy[filters.order] = 'asc' == filters.sort ? "asc" : "desc"
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
                gte: new Prisma.Decimal(filters.minTotal)
            }
        }
        if (isNotEmpty(filters.maxTotal) && isNumber(filters.maxTotal)) {
            if (where.total){
                where.total.lte = new Prisma.Decimal(filters.maxTotal)
            }
            else where.total = {
                lte: new Prisma.Decimal(filters.maxTotal)
            }
        }
        if (isNotEmpty(filters.status)) {
            where.status = {
                equals: filters.status
            }
        }
        console.log(where)
        const [orders, count] = await this.prismaService.$transaction([this.prismaService.order.findMany({
            include: {
                customer: true,
                items: {
                    include: {
                        goods: true
                    }
                }
            },
            skip,
            take,
            orderBy,
            where
        }),
        this.prismaService.order.count()]);
        const hasNextPage = count / take > filters.page
        return new HttpResult({
            message: 'GET_ORDER_SUCCESS',
            data: { orders, count, hasNextPage },
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
        const goodsList = []
        goods.forEach(item => {
            const found = input.items.find(elem => elem.id == item.id)
            if (found.quantity > item.quantity) {
                quantityChecking = false;
                return;
            }
            found.price = item.unitPrice;

            updateGoodsJobs.push(this.prismaService.goods.update({
                where: {
                    id: item.id
                },
                data: {
                    quantity: item.quantity - found.quantity
                }
            }))
            goodsList.push(found);
            total += parseFloat(item.unitPrice.toString()) /// need to findout why prisma store decimal type as string
        });

        if (!quantityChecking) {
            return new HttpResult({
                status: false,
                message: "ITEM_QUANTITY_IS_INCORRECT"
            })
        }
        updateGoodsJobs.push(this.prismaService.order.create({
            data: {
                customerId: input.customerId,
                total,
                items: {
                    create: goodsList.map(item => {
                        return {
                            goods: {
                                connect: {
                                    id: item.id
                                }
                            },
                            quantity: item.quantity,
                            price: item.price
                        }
                    })
                }

            }
        }))
        const result = await this.prismaService.$transaction(updateGoodsJobs);

        return new HttpResult({
            status: true,
            message: 'CREATE_ORDER_SUCCESS',
            data: { order: result.pop() }
        })
    }
}
