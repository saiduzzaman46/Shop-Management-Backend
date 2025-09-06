import { IsString, Matches, IsEmail, IsOptional, MaxLength, IsObject } from 'class-validator';

export class UpdateSellerDto {
  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z\s]+$/, { message: 'Name must contain only alphabets' })
  @MaxLength(150, { message: 'Name is too long' })
  fullName?: string;
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;
  @IsString()
  @IsOptional()
  @Matches(/^\+?\d{11}$/, { message: 'Invalid phone number' })
  phone?: string;
  @IsString()
  @IsOptional()
  storeAddress?: string;
  @IsString()
  @IsOptional()
  storeName?: string;
  @IsObject()
  @IsOptional()
  seller?: object;
}
