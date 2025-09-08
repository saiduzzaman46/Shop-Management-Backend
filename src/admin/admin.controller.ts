import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Request,
  Get,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Brand } from './entity/brand.entity';
import { Category } from './entity/categories.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { insertFile } from 'src/utils/multer.util';
import { FileCleanupInterceptor } from 'src/utils/file-cleanup.interceptor';
import { Roles } from 'src/auth/roles.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { AdminAccountDto } from './dto/admin.account.dto';
import { User } from 'src/auth/entity/user.entity';
import { AuthService } from 'src/auth/auth.service';
import { UpdatePasswordDto } from 'src/auth/dto/updatePassword.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminServise: AdminService,
    private readonly authService: AuthService,
  ) {}

  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles('admin')
  @Post('createaccount')
  async createAccount(@Body() createAccountDto: AdminAccountDto): Promise<User> {
    return this.adminServise.createAccount(createAccountDto);
  }

  @Post('password/update')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async updatePassword(
    @Request() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const id: string = req.user.id;
    return this.authService.updatePassword(id, updatePasswordDto);
  }

  @Post('addbrand')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FilesInterceptor(
      'brandLogo',
      1,
      insertFile(
        './uploads/brandLogo',
        /\.(jpg|jpeg|png)$/i,
        2 * 1024 * 1024,
        'jpg, jpeg, png, webp',
      ),
    ),
    new FileCleanupInterceptor('./uploads/brandLogo'),
  )
  async createBrand(
    @Body() createBrandDto: CreateBrandDto[],
    @UploadedFiles() brandLogo: Express.Multer.File,
  ): Promise<Brand[]> {
    // createBrandDto.logo = brandLogo.filename;
    return this.adminServise.createBrand(createBrandDto);
  }
  @Post('addcategory')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto[]): Promise<Category[]> {
    return this.adminServise.createCategory(createCategoryDto);
  }

  @Get('getbrands')
  async getAllBrands(): Promise<Brand[]> {
    return this.adminServise.getAllBrands();
  }

  @Get('getcategories')
  async getAllCategories(): Promise<Category[]> {
    return this.adminServise.getAllCategories();
  }
}
