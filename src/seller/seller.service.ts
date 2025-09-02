import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { CreateSellerDto } from './dto/seller.create.dto';
import { Seller } from './entity/create.seller.entity';
import * as bcrypt from 'bcrypt';
import { User } from 'src/auth/entity/user.entity';
import { UpdateSellerDto } from './dto/seller.update.dto';
import { SellerResponseDto } from './dto/seller.response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
  ) {}

  private async findUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async checkIfExists<T extends ObjectLiteral>(
    repository: Repository<T>,
    condition: Partial<T>,
    errorMessage: string,
  ): Promise<void> {
    const existing = await repository.findOne({ where: condition });
    if (existing) {
      throw new BadRequestException(errorMessage);
    }
  }

  //👉 Seller-related methods
  async signupSeller(createSellerDto: CreateSellerDto): Promise<Seller> {
    await this.checkIfExists(
      this.userRepository,
      { email: createSellerDto.email },
      'Email already exists',
    );
    // await this.checkIfExists(
    //   this.sellerRepository,
    //   { username: createSellerDto.username },
    //   'Username already exists',
    // );

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createSellerDto.password, salt);

    const user = this.userRepository.create({
      email: createSellerDto.email,
      password: hashedPassword,
      role: 'seller',
    });

    const savedUser = await this.userRepository.save(user);

    const seller = this.sellerRepository.create({
      fullName: createSellerDto.fullName,
      // username: createSellerDto.username,
      phone: createSellerDto.phone,
      nid: createSellerDto.nid,
      nidImage: createSellerDto.nidImage,
      storeAddress: createSellerDto.address,
      storeName: createSellerDto.storeName,
      user: savedUser,
      isActive: false,
    });

    const savedSeller = await this.sellerRepository.save(seller);

    return savedSeller;
  }

  async getProfile(userId: string) {
    const user = await this.findUser(userId);

    const profile = {
      ...user,
      ...user.seller,
    };

    return plainToClass(SellerResponseDto, profile, {
      excludeExtraneousValues: true,
    });
  }

  async updateProfile(userId: string, updateData: UpdateSellerDto): Promise<SellerResponseDto> {
    const user = await this.findUser(userId);

    // if (updateData.email && updateData.email !== user.email) {
    //   const emailExists = await this.userRepository.findOne({ where: { email: updateData.email } });
    //   if (emailExists) {
    //     throw new BadRequestException('Email already exists');
    //   }
    //   user.email = updateData.email;
    // }

    // if (updateData.username && updateData.username !== user.seller.username) {
    //   const usernameExists = await this.sellerRepository.findOne({
    //     where: { username: updateData.username },
    //   });
    //   if (usernameExists) {
    //     throw new BadRequestException('Username already exists');
    //   }
    //   user.seller.username = updateData.username;
    // }

    if (updateData.email) {
      await this.checkIfExists(
        this.userRepository,
        { email: updateData.email },
        'Email already exists',
      );
      user.email = updateData.email;
    }
    // if (updateData.username) {
    //   await this.checkIfExists(
    //     this.sellerRepository,
    //     {
    //       username: updateData.username,
    //     },
    //     'Username already exists',
    //   );
    //   user.seller.username = updateData.username;
    // }

    Object.assign(user.seller, updateData);

    await this.userRepository.save(user);
    await this.sellerRepository.save(user.seller);

    return this.getProfile(user.id);
  }
}
