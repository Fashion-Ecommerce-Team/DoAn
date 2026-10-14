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
    public ApiResponse<Object> getRevenueChart(@RequestParam(defaultValue = "7days") String period) {
        return ApiResponse.success("Lấy biểu đồ doanh thu thành công", dashboardService.getRevenueChart(period));
    }
}
