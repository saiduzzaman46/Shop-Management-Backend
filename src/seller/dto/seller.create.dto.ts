import {
  IsString,
  IsNotEmpty,
  Matches,
  IsEmail,
  IsOptional,
  MaxLength,
  IsArray,
} from 'class-validator';

export class CreateSellerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z\s]+$/, { message: 'Name must contain only alphabets' })
  @MaxLength(150, { message: 'Name is too long' })
  fullName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?\d{11}$/, { message: 'Invalid phone number' })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^.{8,}$/, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @Matches(/^\d{10}$|^\d{13}$/, {
    message: 'NID must be exactly 10 or 13 numbers',
  })
  nid: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nidImage?: string[];

  @IsString()
  @IsOptional()
  storeAddress?: string;

  @IsString()
  @IsOptional()
  storeName?: string;
}
