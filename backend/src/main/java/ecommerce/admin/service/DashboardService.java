package ecommerce.admin.service;

public interface DashboardService {
    Object getStats();

    Object getRecentOrders();

    Object getTopSelling();

    Object getRevenueChart(String period);
}
