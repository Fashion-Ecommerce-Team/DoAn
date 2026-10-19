export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  cloudinaryPublicId: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariantResponse {
  id: number;
  size: string;
  color: string;
  stock: number;
  sku: string;
  status: boolean;
}

export interface ProductResponse {
  id: number;
  categoryId: number;
  brandId: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  discountPrice: number;
  gender: string;
  tags: string;
  viewCount: number;
  status: string;
  images: ProductImageResponse[];
  variants: ProductVariantResponse[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProductRequest {
  categoryId: number;
  brandId?: number;
  name: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  discountPrice?: number;
  gender?: string;
  tags?: string;
  status?: string;
}
