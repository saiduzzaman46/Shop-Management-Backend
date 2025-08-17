import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;
  @IsString()
  @IsNotEmpty()
  @Matches(/^.{8,}$/, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
