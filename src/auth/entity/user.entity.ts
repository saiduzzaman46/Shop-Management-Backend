import { Entity, Column, OneToOne, CreateDateColumn, PrimaryColumn, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Seller } from 'src/seller/entity/create.seller.entity';
import { Exclude } from 'class-transformer';
import { Customer } from 'src/customer/entity/signup.entity';
// import { Admin } from 'src/admins/admin.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  role: 'seller' | 'customer' | 'admin';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updateAt: Date;

  // user.entity.ts
  @Column({ type: 'varchar', nullable: true })
  resetCode?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetCodeExpires?: Date | null;

  @OneToOne(() => Seller, (seller) => seller.user, {
    cascade: true,
    eager: true,
  })
  seller: Seller;

  @OneToOne(() => Customer, (customer) => customer.user)
  customer: Customer;

  //   @OneToOne(() => Admin, (admin) => admin.user)
  //   admin: Admin;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
