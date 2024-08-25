import {  
  Column,
  Entity,
  ManyToMany,
} from 'typeorm';
import { Base } from './base.entity';
import { OrderEntity } from './order.entity';


@Entity()
export class GoodsEntity extends Base<GoodsEntity> {
  @Column('varchar', { length: 64, nullable: false })
  public name: string;

  @Column('int', { default: 0 })
  public quantity: number;

  @ManyToMany(()=>OrderEntity, order=>order.items)
  orders: OrderEntity[]
  
}
