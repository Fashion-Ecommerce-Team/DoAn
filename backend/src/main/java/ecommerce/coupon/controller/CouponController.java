package ecommerce.coupon.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.coupon.dto.CouponResponse;
import ecommerce.coupon.dto.CouponValidateRequest;
import ecommerce.coupon.dto.CouponValidateResponse;
import ecommerce.coupon.service.CouponService;
import ecommerce.security.CustomUserDetails;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> available(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {

        List<CouponResponse> result =
                couponService.getAvailableCoupons(
                        currentUser.getUserId()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Lấy danh sách mã giảm giá thành công",
                        result
                )
        );
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CouponValidateResponse>> validate(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CouponValidateRequest request
    ) {

        CouponValidateResponse result =
                couponService.validate(
                        currentUser.getUserId(),
                        request.getCouponCode()
                );

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Kiểm tra mã giảm giá thành công",
                        result
                )
        );
    }
}