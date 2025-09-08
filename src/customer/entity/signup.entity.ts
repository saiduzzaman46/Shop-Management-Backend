import { User } from 'src/auth/entity/user.entity';
import { Order } from 'src/order/entities/order.entity';
import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  fullName: string;

  @Column()
  gender: 'male' | 'female';

  @Column({ type: 'bigint', unsigned: true })
  phone: number;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  profilePic?: string;

  @OneToOne(() => User, (user) => user.seller, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
