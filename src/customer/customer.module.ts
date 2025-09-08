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

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, User, Product, Order]),
    JwtModule.register({
      global: true,
      secret: 'I use the weak guard in my project 4876324356874623',
      signOptions: { expiresIn: '1d' },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: `"No Reply" <${process.env.SMTP_USER}>`,
      },
    }),
  ],
  providers: [CustomerService],
  controllers: [CustomerController],
})
export class CustomerModule {}
