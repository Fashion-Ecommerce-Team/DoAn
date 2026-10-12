
package ecommerce.order.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ecommerce.common.response.ApiResponse;
import ecommerce.order.dto.CreateOrderRequest;
import ecommerce.order.dto.CreateOrderResponse;
import ecommerce.order.service.OrderService;
import ecommerce.security.CustomUserDetails;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CreateOrderResponse>> createOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateOrderRequest request) {

        CreateOrderResponse result = orderService.createOrder(
                currentUser.getUserId(), request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Tạo đơn hàng thành công",
                        result));
    }
}
