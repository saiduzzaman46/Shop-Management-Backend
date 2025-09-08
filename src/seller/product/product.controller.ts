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

  @Patch('updateproduct/:id')
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
  async updateProduct(
    @Request() req,
    @Body() updateProductDto: Partial<CreateProductDto>,
    @Param('id') productId: string,
    @UploadedFiles() images: Express.Multer.File[],
  ): Promise<Product> {
    updateProductDto.images = images.map((image) => image.filename);
    return this.productService.updateProduct(productId, updateProductDto, req.user.id);
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
