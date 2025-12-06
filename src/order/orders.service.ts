import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from 'src/seller/product/entity/product.entity';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CartItem } from './entities/cart-item.entity';
import { User } from 'src/auth/entity/user.entity';
import * as Pusher from 'pusher';

@Injectable()
export class OrdersService {
  private readonly pusher: Pusher;

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(CartItem) private readonly cartRepo: Repository<CartItem>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    // Initialize Pusher here
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }

  /** Add product to cart */
  async addToCart(userId: string, productId: string, quantity: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });
    if (!user || !user.customer) throw new NotFoundException('Customer profile not found');
    const customerId = user.customer.id;

    const product = await this.productRepo.findOneBy({ productId });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.cartRepo.findOne({
      where: { customer: { id: customerId }, product: { productId } },
      relations: ['product', 'customer'],
    });

    if (existing) {
      existing.quantity += quantity;
      return this.cartRepo.save(existing);
    }

    const cartItem = this.cartRepo.create({
      customer: { id: customerId } as any,
      product: { productId } as any,
      quantity,
    });
    return this.cartRepo.save(cartItem);
  }

  /** Get cart items */
  async getCart(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });
    if (!user || !user.customer) throw new NotFoundException('Customer profile not found');
    const customerId = user.customer.id;

    return this.cartRepo.find({
      where: { customer: { id: customerId } },
      relations: ['product'],
    });
  }

  /** Remove item from cart */
  async removeFromCart(cartId: string) {
    return this.cartRepo.delete(cartId);
  }

  /** Checkout cart and create order with Pusher notifications */
  async checkout(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });
    if (!user || !user.customer) throw new NotFoundException('Customer profile not found');
    const customerId = user.customer.id;

    const cartItems = await this.cartRepo.find({
      where: { customer: { id: customerId } },
      relations: ['product'],
    });
    if (cartItems.length === 0) throw new NotFoundException('Cart is empty');

    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    const order = this.orderRepo.create({
      customer: { id: customerId } as any,
      total,
      status: OrderStatus.PENDING,
    });
    const savedOrder = await this.orderRepo.save(order);

    for (const item of cartItems) {
      await this.orderItemRepo.save(
        this.orderItemRepo.create({
          order: savedOrder,
          product: { productId: item.product.productId } as any,
          quantity: item.quantity,
          price: item.product.price,
        }),
      );

      await this.productRepo.decrement(
        { productId: item.product.productId },
        'quantity',
        item.quantity,
      );

      // Notify seller via Pusher
      const sellerId = 'a0022773-f1f5-4aed-8df9-b43cec8b9cd8'; // Make sure Product entity has sellerId
      await this.pusher.trigger(`seller-${sellerId}`, 'new-order', {
        orderId: savedOrder.id,
        productName: item.product.title,
        quantity: item.quantity,
        total: savedOrder.total,
      });
    }

    await this.cartRepo.delete({ customer: { id: customerId } });

    return this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product'],
    });
  }

  /** Find all orders of a customer */
  async findByCustomer(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });
    if (!user || !user.customer) throw new NotFoundException('Customer profile not found');
    const customerId = user.customer.id;

    return this.orderRepo.find({
      where: { customer: { id: customerId } },
      relations: ['items', 'items.product', 'payments'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Make payment for an order */
  async createPayment(dto: CreatePaymentDto, customerId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: ['customer'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customer.id !== customerId)
      throw new ForbiddenException('This order does not belong to you');

    const payment = this.paymentRepo.create({ ...dto, order });
    const saved = await this.paymentRepo.save(payment);

    if (saved.status === 'completed') {
      order.status = OrderStatus.CONFIRMED;
      await this.orderRepo.save(order);
    }

    return saved;
  }
}
