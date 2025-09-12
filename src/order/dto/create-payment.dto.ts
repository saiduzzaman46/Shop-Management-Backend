import { IsEnum, IsNumber, IsString } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  orderId: string; // <-- add this

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
