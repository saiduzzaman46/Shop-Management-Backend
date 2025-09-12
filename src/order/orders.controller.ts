import { Controller, Post, Get, Body, Req, Delete, UseGuards, Param } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Add product to cart */
  @Post('cart/add')
  @Roles('customer')
  async addToCart(@Body() body: { productId: string; quantity: number }, @Req() req) {
    const userId = req.user.id;
    return this.ordersService.addToCart(userId, body.productId, body.quantity);
  }

  /** View cart */
  @Get('cart')
  @Roles('customer')
  async getCart(@Req() req) {
    const customerId = req.user.id;
    return this.ordersService.getCart(customerId);
  }

  /** Remove cart item */
  @Delete('cart/:id')
  @Roles('customer')
  async removeItem(@Param('id') id: string) {
    return this.ordersService.removeFromCart(id);
  }

  /** Checkout cart */
  @Post('checkout')
  @Roles('customer')
  async checkout(@Req() req) {
    const customerId = req.user.id;
    return this.ordersService.checkout(customerId);
  }

  /** View my orders */
  @Get('my-orders')
  @Roles('customer')
  async findMyOrders(@Req() req) {
    const customerId = req.user.id;
    return this.ordersService.findByCustomer(customerId);
  }

  /** Make payment */
  @Post('pay')
  @Roles('customer')
  async payOrder(@Body() dto: CreatePaymentDto, @Req() req) {
    const customerId = req.user.id;
    return this.ordersService.createPayment(dto, customerId);
  }
}
