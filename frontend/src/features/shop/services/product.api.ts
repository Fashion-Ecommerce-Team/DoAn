import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '@/types/response.type';
import { ProductSummary, ProductDetail, Category, Brand, ProductFilterParams } from '../types/product.types';

// Mock data streetwear phong cách SEEME chuẩn chỉnh cho fallback/preview
export const MOCK_SEEME_PRODUCTS: ProductSummary[] = [
  {
    id: 101,
    name: 'SEEME SIGNATURE MONOGRAM ZIP HOODIE',
    slug: 'seeme-signature-monogram-zip-hoodie',
    basePrice: 850000,
    discountPrice: 699000,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 1, name: 'Hoodie & Jacket', slug: 'hoodie-jacket' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    totalStock: 45,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Đen', 'Xám'],
    createdAt: '2026-02-15T10:00:00',
  },
  {
    id: 102,
    name: 'SEEME Y2K CYBER OVERSIZED TEE',
    slug: 'seeme-y2k-cyber-oversized-tee',
    basePrice: 490000,
    discountPrice: 390000,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 2, name: 'Áo Thun', slug: 'ao-thun' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    totalStock: 80,
    availableSizes: ['M', 'L', 'XL'],
    availableColors: ['Đen', 'Trắng'],
    createdAt: '2026-03-01T08:30:00',
  },
  {
    id: 103,
    name: 'SEEME UTILITY TACTICAL CARGO PANTS',
    slug: 'seeme-utility-tactical-cargo-pants',
    basePrice: 750000,
    discountPrice: null,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 3, name: 'Quần Dài', slug: 'quan-dai' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
    totalStock: 32,
    availableSizes: ['S', 'M', 'L'],
    availableColors: ['Rêu Khaki', 'Đen'],
    createdAt: '2026-03-05T14:15:00',
  },
  {
    id: 104,
    name: 'SEEME ACID WASH VINTAGE SWEATSHIRT',
    slug: 'seeme-acid-wash-vintage-sweatshirt',
    basePrice: 680000,
    discountPrice: 550000,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 1, name: 'Hoodie & Jacket', slug: 'hoodie-jacket' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    totalStock: 18,
    availableSizes: ['M', 'L', 'XL'],
    availableColors: ['Xám Khói'],
    createdAt: '2026-03-10T12:00:00',
  },
  {
    id: 105,
    name: 'SEEME HEAVYWEIGHT BOX LOGO TEE - BLACK',
    slug: 'seeme-heavyweight-box-logo-tee-black',
    basePrice: 450000,
    discountPrice: null,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 2, name: 'Áo Thun', slug: 'ao-thun' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    totalStock: 120,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Đen'],
    createdAt: '2026-03-12T16:00:00',
  },
  {
    id: 106,
    name: 'SEEME RACING LEATHER VARSITY JACKET',
    slug: 'seeme-racing-leather-varsity-jacket',
    basePrice: 1450000,
    discountPrice: 1290000,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 1, name: 'Hoodie & Jacket', slug: 'hoodie-jacket' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    totalStock: 15,
    availableSizes: ['M', 'L'],
    availableColors: ['Đen Trắng'],
    createdAt: '2026-03-14T09:00:00',
  },
  {
    id: 107,
    name: 'SEEME METALLIC MINI SHOULDER BAG',
    slug: 'seeme-metallic-mini-shoulder-bag',
    basePrice: 390000,
    discountPrice: 320000,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 4, name: 'Phụ Kiện', slug: 'phu-kien' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
    totalStock: 60,
    availableSizes: ['FREESIZE'],
    availableColors: ['Bạc Metallic', 'Đen'],
    createdAt: '2026-03-16T11:20:00',
  },
  {
    id: 108,
    name: 'SEEME DISTRESSED BAGGY DENIM JEANS',
    slug: 'seeme-distressed-baggy-denim-jeans',
    basePrice: 790000,
    discountPrice: 650000,
    gender: 'UNISEX',
    status: 'ACTIVE',
    category: { id: 3, name: 'Quần Dài', slug: 'quan-dai' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
    totalStock: 25,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Xanh Vintage'],
    createdAt: '2026-03-18T15:45:00',
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'ÁO THUN (TEES)', slug: 'ao-thun' },
  { id: 2, name: 'HOODIE & SWEATSHIRT', slug: 'hoodie' },
  { id: 3, name: 'ÁO KHOÁC (JACKETS)', slug: 'jackets' },
  { id: 4, name: 'QUẦN & SHORTS', slug: 'pants' },
  { id: 5, name: 'PHỤ KIỆN (ACCESSORIES)', slug: 'accessories' },
];

export const productApi = {
  // Lấy danh sách sản phẩm (có lọc, phân trang)
  async getProducts(params?: ProductFilterParams): Promise<PageResponse<ProductSummary>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<ProductSummary>>>('/products', {
        params,
      });
      if (response.data?.data && response.data.data.content?.length > 0) {
        return response.data.data;
      }
    } catch (error) {
      console.warn('API /products failed, using SEEME mock data', error);
    }

    // Fallback nếu backend trống hoặc đang khởi động
    return {
      content: MOCK_SEEME_PRODUCTS,
      pageNo: 0,
      pageSize: 12,
      totalElements: MOCK_SEEME_PRODUCTS.length,
      totalPages: 1,
      last: true,
    };
  },

  // Chi tiết sản phẩm theo ID
  async getProductById(id: number | string): Promise<ProductDetail> {
    const response = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${id}`);
    return response.data.data;
  },

  // Chi tiết sản phẩm theo Slug
  async getProductBySlug(slug: string): Promise<ProductDetail> {
    const response = await apiClient.get<ApiResponse<ProductDetail>>(`/products/slug/${slug}`);
    return response.data.data;
  },

  // Lấy danh mục
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
      if (response.data?.data && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch (e) {
      console.warn('API /categories failed, using mock', e);
    }
    return MOCK_CATEGORIES;
  },

  // Lấy thương hiệu
  async getBrands(): Promise<Brand[]> {
    try {
      const response = await apiClient.get<ApiResponse<Brand[]>>('/brands');
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn('API /brands failed', e);
    }
    return [{ id: 1, name: 'SEEME', slug: 'seeme' }];
  },
};
