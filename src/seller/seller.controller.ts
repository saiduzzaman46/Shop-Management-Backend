import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Request,
  Patch,
  Delete,
} from '@nestjs/common';
import { SellerService } from './seller.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateSellerDto } from './dto/seller.create.dto';
import { FileCleanupInterceptor } from '../utils/file-cleanup.interceptor';
import { insertFile } from 'src/utils/multer.util';
import { AuthGuard } from 'src/auth/auth.guard';
import { UpdateSellerDto } from './dto/seller.update.dto';
import { SellerResponseDto } from './dto/seller.response.dto';
import { UpdatePasswordDto } from '../auth/dto/updatePassword.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { AuthService } from 'src/auth/auth.service';
// import { ProductService } from './product/product.service';
// import { CreateProductDto } from './product/dto/create.product.dto';
// import { Product } from './product/entity/product.entity';

@Controller('seller')
export class SellerController {
  constructor(
    private readonly sellerService: SellerService,
    private readonly authService: AuthService,
  ) {}

  // 👉 Seller-profile route
  @Post('signup')
  @UseInterceptors(
    FilesInterceptor(
      'nidImage',
      2,
      insertFile(
        './uploads/sellerNID',
        /\.(jpg|jpeg|png)$/i,
        2 * 1024 * 1024,
        'jpg, jpeg, png, webp',
      ),
    ),
    new FileCleanupInterceptor('./uploads/sellerNID'),
  )
  signupSeller(
    @Body() createSellerDto: CreateSellerDto,
    @UploadedFiles() nidImage: Express.Multer.File[],
  ): Promise<{ message: string }> {
    if (!nidImage || nidImage.length === 0) {
      throw new BadRequestException('NID image is required');
    }

    createSellerDto.nidImage = nidImage.map((image) => image.filename);
    return this.sellerService.signupSeller(createSellerDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  getProfile(@Request() req): Promise<SellerResponseDto> {
    const id: string = req.user.id;
    return this.sellerService.getProfile(id);
  }

  @Patch('profile/update')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  async updateProfile(
    @Request() req,
    @Body() updateData: UpdateSellerDto,
  ): Promise<{ message: string }> {
    const id: string = req.user.id;
    // console.log('DTO received:', updateData, id);
    return this.sellerService.updateProfile(id, updateData);
  }

  @Patch('password/update')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  updatePassword(
    @Request() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const id: string = req.user.id;
    // console.log('Controller received DTO:', updatePasswordDto, id);
    return this.authService.updatePassword(id, updatePasswordDto);
  }

  @Delete('delete-account')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  async deleteAccount(@Request() req): Promise<{ message: string }> {
    const id: string = req.user.id;
    return this.authService.deleteAccount(id);
  }

  // 👉 Product-related routes
}
