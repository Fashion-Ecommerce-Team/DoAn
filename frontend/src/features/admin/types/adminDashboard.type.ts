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
