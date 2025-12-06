export class ProductResponseDto {
  productId: string;
  title: string;
  description?: string;
  price: number;
  costPrice: number;
  quantity: number;
  images?: string[];
  brandName: string | null;
  categoryName: string | null;
  tags?: string;
  sellerId: string;
}
