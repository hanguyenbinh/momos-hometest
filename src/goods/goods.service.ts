import { Injectable } from '@nestjs/common';
import { isNotEmpty } from 'class-validator';
import { HttpResult } from 'src/common/http/http-result.http';
import { FiltersInterface } from 'src/common/interface/filters.interface';
import { CreateGoodsDto } from 'src/dtos/create-goods.dto';
import { PrismaService } from 'src/prisma/prisma.service';

interface GoodsFilters extends FiltersInterface {
    name: string;
}


@Injectable()
export class GoodsService {
    constructor(private prismaService: PrismaService) { }

    async getAllGoods(filters: GoodsFilters) {
        const take = !Number.isNaN(filters.limit) ? filters.limit : 10;
        const skip = ((!Number.isNaN(filters.page) || filters.page > 0 ? filters.page : 1) - 1) * take;        
        const orderBy = {};
        const where: any = {}
        if (filters.order) {
            orderBy[filters.order] = 0 == filters.sort ? "asc" : "desc"
        }
        if (isNotEmpty(filters.name)){
            where.customer.name = {
                contains: filters.name
            }
        }
        const result = await this.prismaService.goods.findMany({
            skip,
            take,
            orderBy,
            where
        })
        return new HttpResult({
            message: 'GET_ALL_GOODS_SUCCESS',
            data: result
        })
    }

    async getGoodsById(id: number) {
        const goods = await this.prismaService.goods.findUnique({
            where: {
                id
            }
        })
        if (!goods) return new HttpResult({
            status: false,
            message: 'GOODS_NOT_FOUND'
        })
        return new HttpResult({
            message: 'GET_GOODS_BY_ID_SUCCESS',
            data: { goods }
        })
    }

    async createGoods(input:CreateGoodsDto){
        const goods = await this.prismaService.goods.create({
            data: input
        })
        return new HttpResult({
            message: 'CREATE_GOODS_SUCCESS',
            data: {goods}
        })
    }

}
