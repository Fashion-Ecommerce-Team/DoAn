
package ecommerce.order.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.order.dto.CancelOrderRequest;
import ecommerce.order.dto.CreateOrderRequest;
import ecommerce.order.dto.CreateOrderResponse;
import ecommerce.order.service.OrderService;
import ecommerce.security.CustomUserDetails;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // API 13: Tạo đơn hàng
    @PostMapping
    public ResponseEntity<ApiResponse<CreateOrderResponse>> createOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateOrderRequest request) {

        CreateOrderResponse result = orderService.createOrder(
                currentUser.getUserId(), request);

        return ResponseEntity.ok(
                ApiResponse.success("Tạo đơn hàng thành công", result));
    }

    // API 14: Lấy danh sách đơn hàng của người dùng
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOrders(
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        List<Map<String, Object>> result =
                orderService.getOrders(currentUser.getUserId());

        return ResponseEntity.ok(
                ApiResponse.success("Lấy danh sách đơn hàng thành công", result));
    }
    
@GetMapping("/{orderId}")
public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderDetail(
        @AuthenticationPrincipal CustomUserDetails currentUser,
        @PathVariable Long orderId) {

    Map<String, Object> result = orderService.getOrderDetail(
            currentUser.getUserId(), orderId);

    return ResponseEntity.ok(
            ApiResponse.success("Lấy chi tiết đơn hàng thành công", result));
}
@GetMapping("/{orderId}/items")
public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOrderItems(
        @AuthenticationPrincipal CustomUserDetails currentUser,
        @PathVariable Long orderId) {

    List<Map<String, Object>> result = orderService.getOrderItems(
            currentUser.getUserId(), orderId);

    return ResponseEntity.ok(
            ApiResponse.success("Lấy danh sách sản phẩm trong đơn hàng thành công", result));
}

@GetMapping("/{orderId}/status")
public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderStatus(
        @AuthenticationPrincipal CustomUserDetails currentUser,
        @PathVariable Long orderId) {

    Map<String, Object> result =
            orderService.getOrderStatus(currentUser.getUserId(), orderId);

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Lấy trạng thái đơn hàng thành công",
                    result
            )
    );
}

@GetMapping("/{orderId}/status-history")
public ResponseEntity<ApiResponse<List<Map<String, Object>>>>
        getOrderStatusHistory(
                @AuthenticationPrincipal CustomUserDetails currentUser,
                @PathVariable Long orderId) {

    List<Map<String, Object>> result =
            orderService.getOrderStatusHistory(
                    currentUser.getUserId(), orderId);

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Lấy lịch sử trạng thái đơn hàng thành công",
                    result
            )
    );
}

@PatchMapping("/{orderId}/cancel")
public ResponseEntity<ApiResponse<Map<String, Object>>> cancelOrder(
        @AuthenticationPrincipal CustomUserDetails currentUser,
        @PathVariable Long orderId,
        @Valid @RequestBody CancelOrderRequest request) {

    Map<String, Object> result = orderService.cancelOrder(
            currentUser.getUserId(),
            orderId,
            request.getReason()
    );

    return ResponseEntity.ok(
            ApiResponse.success("Hủy đơn hàng thành công", result)
    );
}

}
