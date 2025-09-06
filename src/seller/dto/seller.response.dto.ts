import { Expose } from 'class-transformer';

export class SellerResponseDto {
  @Expose()
  fullName: string;
  @Expose()
  username: string;
  @Expose()
  email?: string;
  @Expose()
  phone: string;
  @Expose()
  role: string;
  @Expose()
  nid: string;
  @Expose()
  nidImage?: string[];
  @Expose()
  storeAddress?: string;
  @Expose()
  storeName?: string;
  @Expose()
  isActive: boolean;
}
