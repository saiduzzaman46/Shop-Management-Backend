import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { CustomerService } from './customer.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, MulterError } from 'multer';
import { CreateCustomerDto } from './dto/create.customer.dto';
import { Customer } from './entity/signup.entity';
import { CustomerGuard } from './customer.guard';
import { UpdatePasswordDto } from './dto/updatePassword.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<{ token: string }> {
    return this.customerService.login(body.email, body.password);
  }

  @Post('create')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(
    FileInterceptor('profilePic', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|webp|png|jpeg)$/)) cb(null, true);
        else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'image'), false);
        }
      },
      limits: { fileSize: 1048576 },
      storage: diskStorage({
        destination: './uploads/customer',
        filename: function (req, file, cb) {
          cb(null, Date.now() + file.originalname);
        },
      }),
    }),
  )
  createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
    @UploadedFile() profilePic: Express.Multer.File,
  ): Promise<Customer> {
    createCustomerDto.profilePic = profilePic?.filename;
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Get('profile')
  @UseGuards(CustomerGuard)
  getProfile(@Req() req) {
    const id: string = req.user.id;
    return this.customerService.getProfile(id);
  }

  @UseGuards(CustomerGuard)
  @Patch('updatephone/:id')
  updatePhone(@Param('id') id: string, @Body('phone') phone: number) {
    return this.customerService.updatePhoneNumber(id, phone);
  }

  @UseGuards(CustomerGuard)
  @Get('fullnamenull')
  getCustomerNullFullName() {
    return this.customerService.getCustomerNullFullName();
  }

  @UseGuards(CustomerGuard)
  @Delete('deletecustomer')
  deleteCustomer(@Query('id', ParseIntPipe) id: string) {
    return this.customerService.deleteCustomer(id);
  }

  @UseGuards(CustomerGuard)
  @Delete('deleteprofile')
  async deleteProfile(@Req() req): Promise<{ message: string }> {
    const id: string = req.user.id;
    return this.customerService.deleteProfile(id);
  }

  @Patch('passwordupdate')
  @UseGuards(CustomerGuard)
  updatePassword(
    @Req() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    return this.customerService.updatePassword(req.user.id, updatePasswordDto);
  }

  @Patch('profile/update')
  @UseGuards(CustomerGuard)
  async updateProfile(@Req() req, @Body() updateDto: Partial<CreateCustomerDto>) {
    const id: string = req.user.id;
    return this.customerService.updateProfile(id, updateDto);
  }

  @Post('forgotpassword')
  async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    return this.customerService.forgotPassword(email);
  }

  @Post('resetpassword')
  async resetPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ): Promise<{ message: string }> {
    return this.customerService.resetPassword(email, code, newPassword);
  }

  @Get('viewproduct')
  async getAllProducts() {
    return this.customerService.getAllProducts();
  }
}
