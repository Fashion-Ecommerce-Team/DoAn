export interface ReviewResponse {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  productId: number;
  productName?: string;
  productImage?: string;
  orderId?: number;
  rating: number;
  comment: string;
  sentimentLabel?: string;
  isVerifiedPurchase?: boolean;
  status: string; // 'APPROVED' | 'PENDING' | 'REJECTED' | 'HIDDEN'
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewStatusRequest {
  status: string;
}
