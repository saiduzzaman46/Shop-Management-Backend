import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  Request,
  Body,
  UploadedFiles,
  BadRequestException,
  Get,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Roles } from 'src/auth/roles.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { insertFile } from 'src/utils/multer.util';
import { FileCleanupInterceptor } from 'src/utils/file-cleanup.interceptor';
import { Product } from './entity/product.entity';
import { CreateProductDto } from './dto/create.product.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ProductResponseDto } from './dto/product.response.dto';
import { Response } from 'express'; // ✅ make sure to import this
import { get } from 'http';
import { UpadatateProductDto } from './dto/update.product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('addproduct')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      5,
      insertFile(
        './uploads/productImages',
        /\.(jpg|jpeg|png|webp)$/i,
        5 * 1024 * 1024,
        'jpg, jpeg, png, webp',
      ),
    ),
    new FileCleanupInterceptor('./uploads/productImages'),
  )
  async createProduct(
    @Request() req,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<Product> {
    if (!images || images.length === 0) {
      throw new BadRequestException('At least one product image is required');
    }

    createProductDto.images = images.map((image) => image.filename);

    return this.productService.createProduct(createProductDto, req.user.id);
  }

  // ✅ Update product data only (no image upload)
  @Patch('updateproduct/data/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  async updateProductData(
    @Request() req,
    @Body() updateProductDto: UpadatateProductDto,
    @Param('id') productId: string,
  ): Promise<Product> {
    // console.log('Update DTO:', updateProductDto);
    return this.productService.updateProductData(productId, updateProductDto, req.user.id);
  }

  // ✅ Update product images only
  @Patch('updateproduct/images/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      5,
      insertFile(
        './uploads/productImages',
        /\.(jpg|jpeg|png|webp)$/i,
        5 * 1024 * 1024,
        'jpg, jpeg, png, webp',
      ),
    ),
    new FileCleanupInterceptor('./uploads/productImages'),
  )
  async updateProductImages(
    @Request() req,
    @Param('id') productId: string,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<Product> {
    const filenames = images.map((image) => image.filename);
    return this.productService.updateProductImages(productId, filenames, req.user.id);
  }

  @Get('myproducts')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  async getMyProducts(@Request() req): Promise<Product[]> {
    return this.productService.getMyProducts(req.user.id);
  }

  @Get('getallproducts')
  async getAllProducts(): Promise<ProductResponseDto[]> {
    return this.productService.getAllProducts();
  }

  @Get('getproduct/:id')
  async getProductById(@Param('id') productId: string): Promise<ProductResponseDto> {
    return this.productService.getProductById(productId);
  }

  @Delete('deleteproduct/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('seller')
  async deleteMyProduct(
    @Param('id') productId: string,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.productService.deleteMyProduct(productId, req.user.id);
  }

  @Get('getimage/:filename')
  getProductImage(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = this.productService.getImagePath(filename);
      return res.sendFile(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'Image not found' });
    }
  }
}
