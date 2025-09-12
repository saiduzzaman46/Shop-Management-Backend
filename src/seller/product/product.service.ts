import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entity/product.entity';
import { CreateProductDto } from './dto/create.product.dto';
import { Repository } from 'typeorm';
import { Seller } from '../entity/create.seller.entity';
import { Category } from 'src/admin/entity/categories.entity';
import { Brand } from 'src/admin/entity/brand.entity';
import { ProductResponseDto } from './dto/product.response.dto';
import { join } from 'path';
import { existsSync } from 'fs';
import { UpadatateProductDto } from './dto/update.product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async createProduct(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    const seller = await this.sellerRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    const category = createProductDto.categoryId
      ? await this.categoryRepository.findOne({
          where: { categoryId: createProductDto.categoryId },
        })
      : null;

    const brand = createProductDto.brandId
      ? await this.brandRepository.findOne({
          where: { brandId: createProductDto.brandId },
        })
      : null;

    if (!seller) {
      throw new BadRequestException('Seller not found for the authenticated user.');
    }
    const product = this.productRepository.create({
      ...createProductDto,
      seller: { id: seller.id } as Seller,
      category,
      brand,
    });

    return await this.productRepository.save(product);
  }

  async updateProductData(
    productId: string,
    updateProductDto: UpadatateProductDto,
    userId: string,
  ): Promise<Product> {
    const seller = await this.sellerRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!seller) {
      throw new BadRequestException('Seller not found for the authenticated user.');
    }

    const product = await this.productRepository.findOne({
      where: { productId, seller: { id: seller.id } },
    });

    if (!product) {
      throw new BadRequestException(
        'Product not found or you are not authorized to update this product.',
      );
    }
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  // ✅ Update product images only
  async updateProductImages(productId: string, images: string[], userId: string): Promise<Product> {
    const seller = await this.sellerRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!seller) {
      throw new BadRequestException('Seller not found for the authenticated user.');
    }

    const product = await this.productRepository.findOne({
      where: { productId, seller: { id: seller.id } },
    });

    if (!product) {
      throw new BadRequestException(
        'Product not found or you are not authorized to update this product.',
      );
    }

    // ✅ Replace images
    product.images = images;
    return await this.productRepository.save(product);
  }
  async getMyProducts(userId: string): Promise<Product[]> {
    const seller = await this.sellerRepository.findOne({
      where: { user: { id: userId } },
      relations: ['products', 'products.category', 'products.brand'],
    });
    if (!seller) {
      throw new BadRequestException('Seller not found for the authenticated user.');
    }
    // const products = seller.products.map((product) => ({
    //   ...product,
    //   categoryName: product.category?.name || null,
    //   brandName: product.brand?.name || null,
    // }));
    return seller.products;
  }

  async getAllProducts(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      relations: ['seller', 'category', 'brand'],
    });

    return products.map((p) => ({
      productId: p.productId,
      title: p.title,
      description: p.description,
      price: p.price,
      costPrice: p.costPrice,
      quantity: p.quantity,
      images: p.images,
      brandName: p.brand?.name || null,
      categoryName: p.category?.name || null,
      tags: p.tags,
    }));
  }
  async getProductById(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { productId },
      relations: ['seller', 'category', 'brand'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      quantity: product.quantity,
      images: product.images,
      brandName: product.brand?.name || null,
      categoryName: product.category?.name || null,
      tags: product.tags,
    };
  }

  async deleteMyProduct(productId: string, userId: string): Promise<{ message: string }> {
    const seller = await this.sellerRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!seller) {
      throw new BadRequestException('Seller not found for the authenticated user.');
    }

    const product = await this.productRepository.findOne({
      where: {
        productId,
        seller: { id: seller.id },
      },
    });

    if (!product) {
      throw new BadRequestException(
        'Product not found or you are not authorized to delete this product.',
      );
    }

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully.' };
  }

  private readonly uploadPath = join(__dirname, '..', '..', '..', '..', 'uploads', 'productImages');

  getImagePath(filename: string): string {
    const filePath = join(this.uploadPath, filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Image not found');
    }

    return filePath;
  }
}
