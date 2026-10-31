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

export const wishlistApi = {
  // Lấy danh sách wishlist
  async getWishlist(page = 0, size = 12): Promise<PageResponse<WishlistItem>> {
    const response = await apiClient.get<ApiResponse<PageResponse<WishlistItem>>>('/wishlists', {
      params: { page, size },
    });
    return response.data.data;
  },

  // Thêm vào wishlist
  async addToWishlist(productId: number): Promise<WishlistItem> {
    const response = await apiClient.post<ApiResponse<WishlistItem>>('/wishlists', { productId });
    return response.data.data;
  },

  // Xóa khỏi wishlist
  async removeFromWishlist(productId: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/wishlists/${productId}`);
  },

  // Kiểm tra trạng thái đã yêu thích hay chưa
  async checkWishlist(productId: number): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<{ inWishlist: boolean }>>(`/wishlists/check/${productId}`);
      return !!response.data?.data?.inWishlist;
    } catch {
      return false;
    }
  },
};
