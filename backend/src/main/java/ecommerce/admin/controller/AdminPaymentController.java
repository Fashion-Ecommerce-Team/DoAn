package ecommerce.admin.controller;

import ecommerce.admin.dto.response.PaymentResponse;
import ecommerce.admin.service.PaymentService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/payments")
public class AdminPaymentController {
    @Autowired
    private PaymentService service;

    @GetMapping
    public ApiResponse<PageResponse<PaymentResponse>> getList(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) Long orderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success("Lấy danh sách thanh toán thành công",
                service.getList(search, status, method, orderId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getById(@PathVariable Long id) {
        return ApiResponse.success("Lấy chi tiết thanh toán thành công", service.getById(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<PaymentResponse> updateStatus(@PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        return ApiResponse.success("Cập nhật trạng thái thanh toán thành công",
                service.updateStatus(id, payload.get("status")));
    }
}
