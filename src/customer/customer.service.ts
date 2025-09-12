import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create.customer.dto';
import { Repository } from 'typeorm';
import { Customer } from './entity/signup.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entity/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Product } from 'src/seller/product/entity/product.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createCustomerDto.password, salt);

    const user = this.userRepository.create({
      email: createCustomerDto.email,
      password: hashedPassword,
      role: 'customer',
    });

    const savedUser = await this.userRepository.save(user);

    const customer = this.customerRepository.create({
      fullName: createCustomerDto.fullName,
      phone: createCustomerDto.phone,
      profilePic: createCustomerDto.profilePic,
      address: createCustomerDto.address,
      gender: createCustomerDto.gender,
      user: savedUser,
      isActive: true,
    });

    const saveCustomer = await this.customerRepository.save(customer);

    return saveCustomer;
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePhoneNumber(id: string, newPhone: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('User not found');

    customer.phone = newPhone;
    return this.customerRepository.save(customer);
  }

  async getCustomerNullFullName(): Promise<Customer[] | null> {
    return this.customerRepository.find({
      where: { fullName: '' },
    });
  }

  async deleteCustomer(id: string): Promise<string> {
    const result = await this.customerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return 'User deleted successfully';
  }

  async deleteProfile(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });
    if (!user?.customer) {
      throw new NotFoundException('Customer profile not found');
    }

    await this.userRepository.delete(userId);

    return { message: 'Account deleted successfully' };
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword, confirmPassword } = updatePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
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

  async updateProfile(userId: string, updateDto: Partial<CreateCustomerDto>) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer'],
    });

    if (!user) {
      throw new NotFoundException('Customer profile not found');
    }

    if (updateDto.email && updateDto.email !== user.email) {
      const emailExists = await this.userRepository.findOne({ where: { email: updateDto.email } });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
      user.email = updateDto.email;
    }

    Object.assign(user.customer, updateDto);

    await this.userRepository.save(user);
    await this.customerRepository.save(user.customer);

    return this.getProfile(userId);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['customer'],
    });

    if (!user) {
      throw new NotFoundException('Customer not found');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 5 * 60 * 1000);
    await this.userRepository.save(user);

    await this.mailerService.sendMail({
      to: user.email,
      from: `"No Reply" <${process.env.SMTP_USER}>`,
      subject: 'Password Reset Code',
      text: `Your Forget password code is ${code}`,
    });

    return { message: 'Password reset code sent' };
  }

  async resetPassword(
    email: string,
    resetCode: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['customer'],
    });

    if (!user) {
      throw new NotFoundException('Customer profile not found');
    }

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

  async getAllProducts(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['category', 'brand'],
    });
  }
}
