import {
  Entity,
  Column,
  BeforeInsert,
  PrimaryColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../product/entity/product.entity';
import { User } from '../../auth/entity/user.entity';

@Entity('sellers')
export class Seller {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 150 })
  fullName: string;

  @Column()
  phone: string;

  @Column()
  nid: string;

  @Column('simple-array', { nullable: true })
  nidImage?: string[];

  @Column({ nullable: true })
  storeAddress?: string;

  @Column({ nullable: true })
  storeName?: string;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @OneToOne(() => User, (user) => user.seller, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
