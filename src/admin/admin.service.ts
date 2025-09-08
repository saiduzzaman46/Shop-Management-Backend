import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Brand } from './entity/brand.entity';
import { Category } from './entity/categories.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminAccountDto } from './dto/admin.account.dto';
import { User } from 'src/auth/entity/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createAccount(createAccountDto: AdminAccountDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createAccountDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createAccountDto.password, salt);

    const account = this.userRepository.create({
      email: createAccountDto.email,
      password: hashedPassword,
      role: 'admin',
    });
    return this.userRepository.save(account);
  }

  async createBrand(createBrandDto: CreateBrandDto[]): Promise<Brand[]> {
    const brand = this.brandRepository.create(createBrandDto);
    return this.brandRepository.save(brand);
  }
  async createCategory(createCategoryDto: CreateCategoryDto[]): Promise<Category[]> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }
  async getAllBrands(): Promise<Brand[]> {
    return await this.brandRepository.find();
  }
  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }
}
