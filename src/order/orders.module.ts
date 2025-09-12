import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Product } from 'src/seller/product/entity/product.entity';
import { CartItem } from './entities/cart-item.entity';
import { User } from 'src/auth/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Payment, Product, CartItem, User])],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
