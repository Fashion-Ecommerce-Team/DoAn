import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '@/types/response.type';
import { ProductSummary, ProductDetail, Category, Brand, ProductFilterParams, ProductVariant } from '../types/product.types';

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
    category: { id: 2, name: 'Hoodie & Jacket', slug: 'hoodie-jacket' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80',
    totalStock: 75,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Đen', 'Xám'],
    variants: [
      { id: 1011, sku: 'SEEME-ZIP-BLK-S', color: 'Đen', size: 'S', price: 699000, stockQuantity: 15, status: 'ACTIVE' },
      { id: 1012, sku: 'SEEME-ZIP-BLK-M', color: 'Đen', size: 'M', price: 699000, stockQuantity: 20, status: 'ACTIVE' },
      { id: 1013, sku: 'SEEME-ZIP-BLK-L', color: 'Đen', size: 'L', price: 699000, stockQuantity: 15, status: 'ACTIVE' },
      { id: 1014, sku: 'SEEME-ZIP-BLK-XL', color: 'Đen', size: 'XL', price: 699000, stockQuantity: 10, status: 'ACTIVE' },
      { id: 1015, sku: 'SEEME-ZIP-GRY-M', color: 'Xám', size: 'M', price: 699000, stockQuantity: 10, status: 'ACTIVE' },
      { id: 1016, sku: 'SEEME-ZIP-GRY-L', color: 'Xám', size: 'L', price: 699000, stockQuantity: 5, status: 'ACTIVE' },
      { id: 1017, sku: 'SEEME-ZIP-GRY-XL', color: 'Xám', size: 'XL', price: 699000, stockQuantity: 0, status: 'ACTIVE' },
    ],
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
    category: { id: 1, name: 'Áo Thun', slug: 'ao-thun' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    totalStock: 90,
    availableSizes: ['M', 'L', 'XL'],
    availableColors: ['Đen', 'Trắng'],
    variants: [
      { id: 1021, sku: 'SEEME-Y2K-BLK-M', color: 'Đen', size: 'M', price: 390000, stockQuantity: 25, status: 'ACTIVE' },
      { id: 1022, sku: 'SEEME-Y2K-BLK-L', color: 'Đen', size: 'L', price: 390000, stockQuantity: 20, status: 'ACTIVE' },
      { id: 1023, sku: 'SEEME-Y2K-BLK-XL', color: 'Đen', size: 'XL', price: 390000, stockQuantity: 15, status: 'ACTIVE' },
      { id: 1024, sku: 'SEEME-Y2K-WHT-M', color: 'Trắng', size: 'M', price: 390000, stockQuantity: 15, status: 'ACTIVE' },
      { id: 1025, sku: 'SEEME-Y2K-WHT-L', color: 'Trắng', size: 'L', price: 390000, stockQuantity: 15, status: 'ACTIVE' },
    ],
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
    category: { id: 3, name: 'Quần Streetwear', slug: 'quan-dai' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
    totalStock: 35,
    availableSizes: ['S', 'M', 'L'],
    availableColors: ['Rêu Khaki', 'Đen'],
    variants: [
      { id: 1031, sku: 'SEEME-CRG-KHK-S', color: 'Rêu Khaki', size: 'S', price: 750000, stockQuantity: 10, status: 'ACTIVE' },
      { id: 1032, sku: 'SEEME-CRG-KHK-M', color: 'Rêu Khaki', size: 'M', price: 750000, stockQuantity: 12, status: 'ACTIVE' },
      { id: 1033, sku: 'SEEME-CRG-BLK-M', color: 'Đen', size: 'M', price: 750000, stockQuantity: 8, status: 'ACTIVE' },
      { id: 1034, sku: 'SEEME-CRG-BLK-L', color: 'Đen', size: 'L', price: 750000, stockQuantity: 5, status: 'ACTIVE' },
    ],
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
    category: { id: 2, name: 'Hoodie & Jacket', slug: 'hoodie-jacket' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    totalStock: 25,
    availableSizes: ['M', 'L', 'XL'],
    availableColors: ['Xám Khói'],
    variants: [
      { id: 1041, sku: 'SEEME-ACD-SMK-M', color: 'Xám Khói', size: 'M', price: 550000, stockQuantity: 12, status: 'ACTIVE' },
      { id: 1042, sku: 'SEEME-ACD-SMK-L', color: 'Xám Khói', size: 'L', price: 550000, stockQuantity: 10, status: 'ACTIVE' },
      { id: 1043, sku: 'SEEME-ACD-SMK-XL', color: 'Xám Khói', size: 'XL', price: 550000, stockQuantity: 3, status: 'ACTIVE' },
    ],
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
    category: { id: 1, name: 'Áo Thun', slug: 'ao-thun' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    totalStock: 110,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Đen'],
    variants: [
      { id: 1051, sku: 'SEEME-BOX-BLK-S', color: 'Đen', size: 'S', price: 450000, stockQuantity: 25, status: 'ACTIVE' },
      { id: 1052, sku: 'SEEME-BOX-BLK-M', color: 'Đen', size: 'M', price: 450000, stockQuantity: 40, status: 'ACTIVE' },
      { id: 1053, sku: 'SEEME-BOX-BLK-L', color: 'Đen', size: 'L', price: 450000, stockQuantity: 30, status: 'ACTIVE' },
      { id: 1054, sku: 'SEEME-BOX-BLK-XL', color: 'Đen', size: 'XL', price: 450000, stockQuantity: 15, status: 'ACTIVE' },
    ],
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
    category: { id: 2, name: 'Hoodie & Jacket', slug: 'hoodie-jacket' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    totalStock: 15,
    availableSizes: ['M', 'L'],
    availableColors: ['Đen Trắng'],
    variants: [
      { id: 1061, sku: 'SEEME-VRS-BW-M', color: 'Đen Trắng', size: 'M', price: 1290000, stockQuantity: 8, status: 'ACTIVE' },
      { id: 1062, sku: 'SEEME-VRS-BW-L', color: 'Đen Trắng', size: 'L', price: 1290000, stockQuantity: 7, status: 'ACTIVE' },
    ],
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
    variants: [
      { id: 1071, sku: 'SEEME-BAG-SLV-F', color: 'Bạc Metallic', size: 'FREESIZE', price: 320000, stockQuantity: 35, status: 'ACTIVE' },
      { id: 1072, sku: 'SEEME-BAG-BLK-F', color: 'Đen', size: 'FREESIZE', price: 320000, stockQuantity: 25, status: 'ACTIVE' },
    ],
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
    category: { id: 3, name: 'Quần Streetwear', slug: 'quan-dai' },
    brand: { id: 1, name: 'SEEME', slug: 'seeme' },
    primaryImageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    secondaryImageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
    totalStock: 28,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColors: ['Xanh Vintage'],
    variants: [
      { id: 1081, sku: 'SEEME-DNR-BLU-S', color: 'Xanh Vintage', size: 'S', price: 650000, stockQuantity: 8, status: 'ACTIVE' },
      { id: 1082, sku: 'SEEME-DNR-BLU-M', color: 'Xanh Vintage', size: 'M', price: 650000, stockQuantity: 10, status: 'ACTIVE' },
      { id: 1083, sku: 'SEEME-DNR-BLU-L', color: 'Xanh Vintage', size: 'L', price: 650000, stockQuantity: 7, status: 'ACTIVE' },
      { id: 1084, sku: 'SEEME-DNR-BLU-XL', color: 'Xanh Vintage', size: 'XL', price: 650000, stockQuantity: 3, status: 'ACTIVE' },
    ],
    createdAt: '2026-03-18T15:45:00',
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'ÁO THUN (TEES)', slug: 'ao-thun' },
  { id: 2, name: 'HOODIE & JACKET', slug: 'hoodie-jacket' },
  { id: 3, name: 'QUẦN STREETWEAR', slug: 'quan-dai' },
  { id: 4, name: 'PHỤ KIỆN & TÚI', slug: 'phu-kien' },
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

    // Lọc dữ liệu Mock chuẩn xác khi backend không phản hồi hoặc đang dùng mock
    let filtered = [...MOCK_SEEME_PRODUCTS];

    if (params?.keyword) {
      const kw = params.keyword.toLowerCase().trim();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(kw) || p.slug.toLowerCase().includes(kw));
    }

    if (params?.categorySlug) {
      filtered = filtered.filter((p) => p.category?.slug === params.categorySlug);
    } else if (params?.categoryId) {
      filtered = filtered.filter((p) => p.category?.id === params.categoryId);
    }

    if (params?.gender) {
      filtered = filtered.filter((p) => p.gender === params.gender || p.gender === 'UNISEX');
    }

    if (params?.minPrice !== undefined) {
      filtered = filtered.filter((p) => (p.discountPrice || p.basePrice) >= params.minPrice!);
    }

    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => (p.discountPrice || p.basePrice) <= params.maxPrice!);
    }

    if (params?.size) {
      filtered = filtered.filter(
        (p) =>
          p.availableSizes?.includes(params.size!) ||
          p.variants?.some((v) => v.size === params.size && v.stockQuantity > 0)
      );
    }

    if (params?.sortBy === 'basePrice') {
      filtered.sort((a, b) => {
        const priceA = a.discountPrice || a.basePrice;
        const priceB = b.discountPrice || b.basePrice;
        return params.sortDir === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else if (params?.sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    const page = params?.page || 0;
    const sizePerPage = params?.sizePerPage || 12;
    const start = page * sizePerPage;
    const paginated = filtered.slice(start, start + sizePerPage);

    return {
      content: paginated,
      pageNo: page,
      pageSize: sizePerPage,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / sizePerPage)),
      last: start + sizePerPage >= filtered.length,
    };
  },

  // Chi tiết sản phẩm theo ID (có fallback đầy đủ variants và images)
  async getProductById(id: number | string): Promise<ProductDetail> {
    try {
      const response = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${id}`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn(`API /products/${id} failed, using mock product`, e);
    }

    const numId = Number(id);
    const mockSummary = MOCK_SEEME_PRODUCTS.find((p) => p.id === numId) || MOCK_SEEME_PRODUCTS[0];

    // Tự sinh variants nếu chưa có
    let variants: ProductVariant[] = mockSummary.variants || [];
    if (variants.length === 0) {
      const colors = mockSummary.availableColors?.length ? mockSummary.availableColors : ['Đen'];
      const sizes = mockSummary.availableSizes?.length ? mockSummary.availableSizes : ['FREESIZE'];
      let vId = 1;
      variants = [];
      for (const c of colors) {
        for (const s of sizes) {
          variants.push({
            id: vId++,
            sku: `SEEME-${mockSummary.id}-${c.substring(0, 3).toUpperCase()}-${s}`,
            color: c,
            size: s,
            price: mockSummary.discountPrice || mockSummary.basePrice,
            stockQuantity: 15,
            status: 'ACTIVE',
          });
        }
      }
    }

    return {
      ...mockSummary,
      description: `Thiết kế ${mockSummary.name} mang đậm dấu ấn phong cách SEEME® Streetwear.
Phom dáng rộng rãi chuẩn phong cách thời trang đường phố đương đại, kết hợp chất liệu vải cao cấp định lượng cao, thoáng mát và co giãn nhẹ.

• Chất liệu: 100% Cotton định lượng cao hoặc nỉ bông giữ ấm thoáng khí.
• Họa tiết: In lụa thủ công cao cấp hoặc thêu tỉ mỉ, sắc nét và bền màu.
• Phom dáng: Boxy / Oversized fit tôn dáng và thoải mái vận động.
• Made in Vietnam by SEEME® team.`,
      images: [
        { id: 1, imageUrl: mockSummary.primaryImageUrl || '', isPrimary: true },
        { id: 2, imageUrl: mockSummary.secondaryImageUrl || mockSummary.primaryImageUrl || '', isPrimary: false },
      ],
      variants,
    };
  },

  // Chi tiết sản phẩm theo Slug
  async getProductBySlug(slug: string): Promise<ProductDetail> {
    try {
      const response = await apiClient.get<ApiResponse<ProductDetail>>(`/products/slug/${slug}`);
      if (response.data?.data) {
        return response.data.data;
      }
    } catch (e) {
      console.warn(`API /products/slug/${slug} failed, using mock`, e);
    }
    const mockSummary = MOCK_SEEME_PRODUCTS.find((p) => p.slug === slug) || MOCK_SEEME_PRODUCTS[0];
    return this.getProductById(mockSummary.id);
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
