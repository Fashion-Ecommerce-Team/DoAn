import apiClient from '@/config/axios';
import { ApiResponse, PageResponse } from '@/types/response.type';

export interface ReviewItem {
  id: number;
  productId: number;
  productName?: string;
  productSlug?: string;
  userId: number;
  userFullName?: string;
  userAvatarUrl?: string;
  orderDetailId?: number;
  rating: number;
  comment: string;
  sentimentLabel?: string; // POSITIVE, NEUTRAL, NEGATIVE
  isVerifiedPurchase: boolean;
  status: string;
  createdAt: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
  reviews: PageResponse<ReviewItem>;
}

export interface CreateReviewPayload {
  productId: number;
  orderDetailId?: number;
  rating: number;
  comment: string;
}

export const reviewApi = {
  // Lấy danh sách đánh giá của sản phẩm kèm tổng hợp sao
  async getProductReviews(
    productId: number,
    params?: { rating?: number; page?: number; size?: number; sortBy?: string; sortDir?: string }
  ): Promise<ProductReviewSummary> {
    const response = await apiClient.get<ApiResponse<ProductReviewSummary>>(
      `/products/${productId}/reviews`,
      { params }
    );
    return response.data.data;
  },

  // Viết đánh giá sản phẩm mới
  async createReview(payload: CreateReviewPayload): Promise<ReviewItem> {
    const response = await apiClient.post<ApiResponse<ReviewItem>>('/reviews', payload);
    return response.data.data;
  },

  // Lấy các đánh giá của tôi
  async getMyReviews(page = 0, size = 10): Promise<PageResponse<ReviewItem>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ReviewItem>>>('/reviews/my-reviews', {
      params: { page, size },
    });
    return response.data.data;
  },
};

