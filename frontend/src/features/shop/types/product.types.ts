export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  status?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  status?: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
  status: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder?: number;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  discountPrice?: number | null;
  gender?: string;
  status: string;
  category?: Category | null;
  brand?: Brand | null;
  primaryImageUrl?: string | null;
  secondaryImageUrl?: string | null;
  totalStock: number;
  availableSizes?: string[];
  availableColors?: string[];
  similarityScore?: number | null;
  createdAt?: string;
}

export interface ProductDetail extends ProductSummary {
  description?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  updatedAt?: string;
}

export interface ProductFilterParams {
  keyword?: string;
  categoryId?: number;
  brandId?: number;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  sizePerPage?: number;
}
