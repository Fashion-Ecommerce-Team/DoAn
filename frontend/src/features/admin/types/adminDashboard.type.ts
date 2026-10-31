export interface DashboardStatsResponse {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
}

export interface RecentOrder {
  id?: number | string;
  _id?: string;
  receiverName?: string;
  customerName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface RevenueData {
  date?: string;
  label?: string;
  revenue?: number;
}

export interface TopSellingProduct {
  id?: number | string;
  _id?: string;
  name?: string;
  price?: number;
  soldQuantity?: number;
  totalSold?: number;
  total_sold?: number;
  revenue?: number;
}

export interface UserGrowthData {
  period: string;
  label: string;
  users: number;
}

export interface OrderGrowthData {
  period: string;
  label: string;
  orders: number;
  revenue?: number;
}

export interface BrandRevenueData {
  id: number;
  name: string;
  logoUrl?: string;
  revenue: number;
  totalSold: number;
  orderCount: number;
}

export interface CategoryRevenueData {
  id: number;
  name: string;
  revenue: number;
  totalSold: number;
  orderCount: number;
}

export interface TopCouponData {
  id: number;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  usageCount: number;
  totalDiscountAmount: number;
  totalOrderAmount: number;
}

export interface CustomerRetentionData {
  totalCustomers: number;
  repeatCustomers: number;
  oneTimeCustomers: number;
  retentionRate: number;
  avgOrdersPerCustomer: number;
  topCustomers: Array<{
    userId: number;
    fullName: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }>;
}

export interface PaymentRevenueData {
  paymentMethod: string;
  totalTransactions: number;
  totalRevenue: number;
  successfulTransactions: number;
  successfulRevenue: number;
}

export interface CancellationStatsData {
  totalOrders: number;
  cancelledOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  cancelledRevenue: number;
  completedRevenue: number;
  cancellationRate: number;
  reasons: Array<{
    reason: string;
    count: number;
  }>;
}
