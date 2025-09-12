import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entity/signup.entity';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/auth/entity/user.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { Product } from 'src/seller/product/entity/product.entity';
import { Order } from 'src/order/entities/order.entity';
import { CartItem } from 'src/order/entities/cart-item.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Product, Order, CartItem]), AuthModule],
  providers: [CustomerService],
  controllers: [CustomerController],
})
export class CustomerModule {}
