import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
export abstract class Base<T> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('integer', { nullable: true })
  createdBy: number;

  @Column('integer', { nullable: true })
  updatedBy: number;

  @Column('integer', { nullable: true })
  deletedBy: number;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  public createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  public updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
  })
  public deletedAt: Date;

  public assign(partial: Partial<T>) {
    Object.keys(this).forEach((key) => {
      if (partial[key] !== undefined) {
        if (Array.isArray(this[key]) && typeof this[key][0] == 'object') {
          this[key] = this.assignArray(this[key], partial[key]);
        } else {
          this[key] = partial[key];
        }
      }
    });
  }
  private assignArray(source: Array<any>, destination: Array<any>) {
    const newElements = [];
    destination.forEach((d) => {
      let isFound = false;
      source.forEach((s) => {
        if (typeof s === 'object') {
          if (s.id === d.id) {
            isFound = true;
            s.assign(d);
            return;
          }
        }
        if (typeof s === 'string') {
          if (s === d) {
            isFound = true;
            s = d;
            return;
          }
        }
      });
      if (!isFound) {
        newElements.push(d);
      }
    });
    return [...source, ...newElements];
  }
}
