export interface CouponResponse {
  id: number;
  code: string;
  description: string;
  discountType: string; // 'PERCENTAGE' or 'FIXED_AMOUNT'
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: string; // 'ACTIVE', 'INACTIVE', 'EXPIRED'
  createdAt: string;
}

export interface CouponRequest {
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  status: string;
}
