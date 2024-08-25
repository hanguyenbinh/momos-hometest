import {
  Column,
  Entity,
  ManyToMany,  
} from 'typeorm';
import { Base } from './base.entity';
import { OrderStatusEnum } from 'src/common/enum/order-status.enum';
import { GoodsEntity } from './goods.entity';


@Entity()
export class OrderEntity extends Base<OrderEntity> {
  @Column('int', {nullable: false})
  customerId: number;

  @Column({type: 'enum', enum: OrderStatusEnum, default: OrderStatusEnum.CREATED})
  public status: OrderStatusEnum;

  @ManyToMany(()=> GoodsEntity, item=>item.orders)
  items: GoodsEntity[];
}
