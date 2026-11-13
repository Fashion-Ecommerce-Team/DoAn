package ecommerce.admin.controller;

import ecommerce.admin.service.DashboardService;
import ecommerce.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ApiResponse<Object> getStats() {
        return ApiResponse.success("Lấy thống kê thành công", dashboardService.getStats());
    }

    @GetMapping("/recent-orders")
    public ApiResponse<Object> getRecentOrders() {
        return ApiResponse.success("Lấy đơn hàng gần đây thành công", dashboardService.getRecentOrders());
    }

    @GetMapping("/top-selling")
    public ApiResponse<Object> getTopSelling() {
        return ApiResponse.success("Lấy sản phẩm bán chạy thành công", dashboardService.getTopSelling());
    }

    @GetMapping("/revenue-chart")
    public ApiResponse<Object> getRevenueChart(@RequestParam(defaultValue = "1year") String period) {
        return ApiResponse.success("Lấy biểu đồ doanh thu thành công", dashboardService.getRevenueChart(period));
    }

    @GetMapping("/user-growth")
    public ApiResponse<Object> getUserGrowthChart() {
        return ApiResponse.success("Lấy biểu đồ tăng trưởng người dùng thành công", dashboardService.getUserGrowthChart());
    }

    @GetMapping("/order-growth")
    public ApiResponse<Object> getOrderGrowthChart() {
        return ApiResponse.success("Lấy biểu đồ tăng trưởng đơn hàng thành công", dashboardService.getOrderGrowthChart());
    }

    @GetMapping("/brand-revenue")
    public ApiResponse<Object> getBrandRevenue() {
        return ApiResponse.success("Lấy doanh thu theo thương hiệu thành công", dashboardService.getBrandRevenue());
    }

    @GetMapping("/category-revenue")
    public ApiResponse<Object> getCategoryRevenue() {
        return ApiResponse.success("Lấy doanh thu theo danh mục thành công", dashboardService.getCategoryRevenue());
    }

    @GetMapping("/top-coupons")
    public ApiResponse<Object> getTopCoupons() {
        return ApiResponse.success("Lấy mã giảm giá sử dụng nhiều nhất thành công", dashboardService.getTopCoupons());
    }

    @GetMapping("/customer-retention")
    public ApiResponse<Object> getCustomerRetention() {
        return ApiResponse.success("Lấy tỷ lệ khách hàng quay lại thành công", dashboardService.getCustomerRetention());
    }

    @GetMapping("/payment-revenue")
    public ApiResponse<Object> getPaymentMethodRevenue() {
        return ApiResponse.success("Lấy doanh thu theo phương thức thanh toán thành công", dashboardService.getPaymentMethodRevenue());
    }

    @GetMapping("/cancellation-rate")
    public ApiResponse<Object> getCancellationStats() {
        return ApiResponse.success("Lấy thống kê tỷ lệ hủy đơn thành công", dashboardService.getCancellationStats());
    }
}
