import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SignInDto } from './dto/user.signin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { getPasswordResetTemplate } from 'template/password.reset.template';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  findUser = async (email): Promise<User> => {
    const user = await this.userRepository.findOne({
      where: { email: email.email },
    });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    return user;
  };

  async signIn(signInDto: SignInDto): Promise<{ token: string; role: string }> {
    const { email, password } = signInDto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    }

    const payload = { id: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    // console.log(token);
    return { token, role: user.role };
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword, confirmPassword } = updatePasswordDto;

    const user = await this.findUser(userId);

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }
    if (newPassword === oldPassword) {
      throw new BadRequestException('New password cannot be the same as old password');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    user.updateAt = new Date();

    await this.userRepository.save(user);
    return { message: 'Password updated successfully' };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findUser(userId);
    if (!user.seller) {
      throw new NotFoundException('Seller profile not found');
    }
    await this.userRepository.delete(userId);

    return { message: 'Account deleted successfully' };
  }

  async forgotPassword(email: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.findUser(email);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 5 * 60 * 1000);
    await this.userRepository.save(user);

    await this.mailerService.sendMail({
      to: user.email,
      from: `"No Reply" <${process.env.SMTP_USER}>`,
      subject: 'Password Reset Code',
      html: getPasswordResetTemplate(user.seller.fullName, code),
    });

    return { message: 'Password reset code sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, resetCode, newPassword } = resetPasswordDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // console.log(user);

    if (
      user.resetCode !== resetCode ||
      !user.resetCodeExpires ||
      user.resetCodeExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetCode = null;
    user.resetCodeExpires = null;
    user.updateAt = new Date();

    await this.userRepository.save(user);
    return { message: 'Password reset successfully' };
  }
}
