import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { SellerModule } from './seller/seller.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './seller/product/product.module';
import * as dotenv from 'dotenv';
import { CustomerModule } from './customer/customer.module';
dotenv.config();

@Module({
  imports: [
    AdminModule,
    CustomerModule,
    SellerModule,
    ProductModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
