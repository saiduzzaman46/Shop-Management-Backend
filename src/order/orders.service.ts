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

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(CartItem) private readonly cartRepo: Repository<CartItem>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /** Add product to cart */
  async addToCart(userId: string, productId: string, quantity: number) {
    // Step 1: Fetch the customer linked to this user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });

    if (!user || !user.customer) {
      throw new NotFoundException('Customer profile not found for this user');
    }
    const customerId = user.customer.id;

    // Step 2: Fetch the product
    const product = await this.productRepo.findOneBy({ productId });
    if (!product) throw new NotFoundException('Product not found');

    // Step 3: Check if item already exists in cart
    const existing = await this.cartRepo.findOne({
      where: { customer: { id: customerId }, product: { productId } },
      relations: ['product', 'customer'],
    });

    if (existing) {
      existing.quantity += quantity;
      return this.cartRepo.save(existing);
    }

    // Step 4: Create new cart item
    const cartItem = this.cartRepo.create({
      customer: { id: customerId } as any,
      product: { productId } as any,
      quantity,
    });
    return this.cartRepo.save(cartItem);
  }

  /** Get cart items */
  async getCart(customerId: string) {
    return this.cartRepo.find({
      where: { customer: { id: customerId } },
      relations: ['product'],
    });
  }

  /** Remove item from cart */
  async removeFromCart(cartId: string) {
    return this.cartRepo.delete(cartId);
  }

  /** Checkout: convert cart to order */
  async checkout(customerId: string) {
    const cartItems = await this.getCart(customerId);
    if (cartItems.length === 0) throw new NotFoundException('Cart is empty');

    // Calculate total
    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    // Create order
    const order = this.orderRepo.create({
      customer: { id: customerId } as any,
      total,
      status: OrderStatus.PENDING,
    });
    const savedOrder = await this.orderRepo.save(order);

    // Save order items & decrement product stock
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
    }

    // Clear cart
    await this.cartRepo.delete({ customer: { id: customerId } });

    return this.orderRepo.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product'],
    });
  }

  /** Find all orders of a customer */
  async findByCustomer(customerId: string) {
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

    const payment = this.paymentRepo.create({
      ...dto,
      order,
    });
    const saved = await this.paymentRepo.save(payment);

    if (saved.status === 'completed') {
      order.status = OrderStatus.CONFIRMED;
      await this.orderRepo.save(order);
    }

    return saved;
  }
}
