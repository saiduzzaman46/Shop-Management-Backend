import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { BeforeInsert } from 'typeorm';
import { Seller } from 'src/seller/entity/create.seller.entity';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '../../../admin/entity/categories.entity';
import { Brand } from '../../../admin/entity/brand.entity';
import { OrderItem } from 'src/order/entities/order-item.entity';

@Entity('products')
export class Product {
  @PrimaryColumn('uuid')
  productId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column()
  quantity: number;

  @Column('text', { array: true, nullable: true })
  images?: string[];

  @Column({ nullable: true })
  tags?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Seller, (seller) => seller.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @ManyToOne(() => Brand, (brand) => brand.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];

  @BeforeInsert()
  generateId() {
    if (!this.productId) {
      this.productId = uuidv4();
    }
  }
}
