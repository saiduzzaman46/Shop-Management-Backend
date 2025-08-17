import { Type } from 'class-transformer';
import {
  IsOptional,
  IsEmail,
  Matches,
  MinLength,
  IsIn,
  IsNumberString,
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  isNotEmpty,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  password?: string;

  @IsNotEmpty()
  @IsIn(['male', 'female'], { message: 'Gender must be either male or female' })
  gender: 'male' | 'female';

  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber({}, { message: 'Phone number must contain only numbers' })
  phone: number;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePic?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be true or false' })
  isActive?: boolean;
}
