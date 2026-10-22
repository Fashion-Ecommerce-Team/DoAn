package ecommerce.admin.controller;

import ecommerce.admin.dto.response.OrderResponse;
import ecommerce.admin.dto.response.OrderStatusHistoryResponse;
import ecommerce.admin.service.OrderService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

    @Autowired
    private OrderService service;

    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách đơn hàng thành công", service.getList(search, status, userId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin chi tiết đơn hàng thành công", service.getById(id));
    }

    @GetMapping("/{id}/history")
    public ApiResponse<List<OrderStatusHistoryResponse>> getHistory(@PathVariable Long id) {
        return ApiResponse.success("Lấy lịch sử trạng thái đơn hàng thành công", service.getHistory(id));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String note = payload.get("note") != null ? payload.get("note") : payload.get("reason");
        service.updateStatus(id, status, note);
        return ApiResponse.success("Cập nhật trạng thái đơn hàng thành công", null);
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        String reason = payload != null ? payload.get("reason") : null;
        service.cancel(id, reason);
        return ApiResponse.success("Hủy đơn hàng thành công", null);
    }
}
