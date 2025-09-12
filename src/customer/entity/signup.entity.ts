import { User } from 'src/auth/entity/user.entity';
import { CartItem } from 'src/order/entities/cart-item.entity';
import { Order } from 'src/order/entities/order.entity';
import { Entity, Column, OneToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
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

  @OneToMany(() => CartItem, (cart) => cart.customer)
  cartItems: CartItem[];
}
