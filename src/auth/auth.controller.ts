import { Response } from 'express';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/user.signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import * as dotenv from 'dotenv';
dotenv.config();

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string; role: string }> {
    const { token, role } = await this.authService.signIn(signInDto);
    const maxAge = Number(process.env.JWT_COOKIE_MAX_AGE) || 1000 * 60 * 60 * 24;

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      sameSite: 'strict',
      maxAge: maxAge, // 1 day
    });

    return { message: 'Login successful', role };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() email: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
