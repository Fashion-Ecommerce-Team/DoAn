import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '@/types/response.type';

export interface WishlistItem {
  wishlistId: number;
  productId: number;
  name: string;
  slug: string;
  basePrice: number;
  discountPrice?: number | null;
  primaryImageUrl?: string | null;
  categoryName?: string | null;
  brandName?: string | null;
  inStock: boolean;
  addedAt?: string;
}

const WISHLIST_STORAGE_KEY = 'seeme_wishlist_items';

// Helpers lưu trữ cục bộ (Guest & Offline Fallback)
function getLocalWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(items: WishlistItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('wishlist_updated'));
  } catch {
    // ignore
  }
}

export const wishlistApi = {
  // Lấy danh sách wishlist (đồng bộ Backend + LocalStorage)
  async getWishlist(page = 0, size = 50): Promise<PageResponse<WishlistItem>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<WishlistItem>>>('/wishlists', {
        params: { page, size },
      });
      if (response.data?.data && response.data.data.content) {
        // Đồng bộ dữ liệu backend vào local
        saveLocalWishlist(response.data.data.content);
        return response.data.data;
      }
    } catch {
      // Backend offline hoặc chưa đăng nhập
    }

    const localItems = getLocalWishlist();
    const start = page * size;
    const paginated = localItems.slice(start, start + size);

    return {
      content: paginated,
      pageNo: page,
      pageSize: size,
      totalElements: localItems.length,
      totalPages: Math.max(1, Math.ceil(localItems.length / size)),
      last: start + size >= localItems.length,
    };
  },

  // Thêm vào wishlist (hỗ trợ cả khách vãng lai và người dùng đã login)
  async addToWishlist(productId: number, productData?: Partial<WishlistItem>): Promise<WishlistItem> {
    let resultItem: WishlistItem = {
      wishlistId: Date.now(),
      productId,
      name: productData?.name || `Sản phẩm #${productId}`,
      slug: productData?.slug || `product-${productId}`,
      basePrice: productData?.basePrice || 0,
      discountPrice: productData?.discountPrice,
      primaryImageUrl: productData?.primaryImageUrl || null,
      categoryName: productData?.categoryName || 'Streetwear',
      brandName: productData?.brandName || 'SEEME®',
      inStock: productData?.inStock ?? true,
      addedAt: new Date().toISOString(),
    };

    // 1. Thử gửi lên backend nếu có token đăng nhập
    try {
      const response = await apiClient.post<ApiResponse<WishlistItem>>('/wishlists', { productId });
      if (response.data?.data) {
        resultItem = response.data.data;
      }
    } catch {
      // Khách chưa login hoặc backend đang tắt, tiếp tục lưu local mượt mà
    }

    // 2. Cập nhật LocalStorage
    const local = getLocalWishlist();
    if (!local.some((item) => item.productId === productId)) {
      saveLocalWishlist([resultItem, ...local]);
    }

    return resultItem;
  },

  // Xóa khỏi wishlist
  async removeFromWishlist(productId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/wishlists/${productId}`);
    } catch {
      // ignore
    }

    const local = getLocalWishlist();
    saveLocalWishlist(local.filter((item) => item.productId !== productId));
  },

  // Kiểm tra trạng thái đã yêu thích hay chưa
  async checkWishlist(productId: number): Promise<boolean> {
    const local = getLocalWishlist();
    if (local.some((item) => item.productId === productId)) {
      return true;
    }

    try {
      const response = await apiClient.get<ApiResponse<{ inWishlist: boolean }>>(`/wishlists/check/${productId}`);
      const inWishlist = !!response.data?.data?.inWishlist;
      if (inWishlist && !local.some((i) => i.productId === productId)) {
        saveLocalWishlist([
          ...local,
          {
            wishlistId: Date.now(),
            productId,
            name: '',
            slug: '',
            basePrice: 0,
            inStock: true,
          },
        ]);
      }
      return inWishlist;
    } catch {
      return false;
    }
  },

  // Lấy toàn bộ ID sản phẩm đã yêu thích
  getLocalWishlistIds(): number[] {
    return getLocalWishlist().map((i) => i.productId);
  },
};
