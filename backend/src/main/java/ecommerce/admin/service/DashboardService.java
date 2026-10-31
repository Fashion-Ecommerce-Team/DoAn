package ecommerce.admin.service;

public interface DashboardService {
    Object getStats();

    Object getRecentOrders();

    Object getTopSelling();

    Object getRevenueChart(String period);

    Object getUserGrowthChart();

    Object getOrderGrowthChart();

    Object getBrandRevenue();

    Object getCategoryRevenue();

    Object getTopCoupons();

    Object getCustomerRetention();

    Object getPaymentMethodRevenue();

    Object getCancellationStats();
}
