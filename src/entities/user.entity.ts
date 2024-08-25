import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,  
} from 'typeorm';
import { Base } from './base.entity';
import * as bcrypt from 'bcryptjs';


@Entity()
export class UserEntity extends Base<UserEntity> {
  @Column('varchar', {length: 255, nullable: false})
  public email: string;

  @Column({ select: false })
  public password: string;

  @Column('varchar', { length: 64, nullable: true })
  public firstName: string;

  @Column('varchar', { length: 64, nullable: true })
  public lastName: string;

  @Column('varchar', {
    length: 16,
    unique: true,
    nullable: true,
  })
  phone: string;  

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
