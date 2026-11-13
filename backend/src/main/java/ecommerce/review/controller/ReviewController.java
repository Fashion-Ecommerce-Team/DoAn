package ecommerce.review.controller;

import ecommerce.common.response.ApiResponse;
import ecommerce.common.response.PageResponse;
import ecommerce.common.util.SecurityUtils;
import ecommerce.review.dto.CreateReviewRequest;
import ecommerce.review.dto.ProductReviewSummaryResponse;
import ecommerce.review.dto.ReviewResponse;
import ecommerce.review.service.ReviewService;
import ecommerce.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Reviews", description = "APIs đánh giá & phản hồi sản phẩm")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/api/v1/products/{productId}/reviews")
    @Operation(summary = "Lấy danh sách đánh giá của sản phẩm",
               description = "Lấy danh sách đánh giá có phân trang, điểm trung bình và biểu đồ sao của sản phẩm")
    public ResponseEntity<ApiResponse<ProductReviewSummaryResponse>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        ProductReviewSummaryResponse response = reviewService.getProductReviews(productId, rating, page, size, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá sản phẩm thành công!", response));
    }

    @PostMapping("/api/v1/reviews")
    @Operation(summary = "Tạo đánh giá sản phẩm mới",
               description = "Viết đánh giá kèm số sao và nhận xét cho sản phẩm (sau khi mua hàng)")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        ReviewResponse response = reviewService.createReview(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đánh giá sản phẩm thành công!", response));
    }

    @GetMapping("/api/v1/reviews/my-reviews")
    @Operation(summary = "Lấy danh sách đánh giá của tôi",
               description = "Lấy danh sách tất cả các đánh giá mà người dùng hiện tại đã viết")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        PageResponse<ReviewResponse> response = reviewService.getMyReviews(email, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá của bạn thành công!", response));
    }

    @DeleteMapping("/api/v1/reviews/{id}")
    @Operation(summary = "Xóa đánh giá sản phẩm",
               description = "Xóa một đánh giá do người dùng viết hoặc quyền quản trị viên")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        reviewService.deleteReview(email, id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa đánh giá thành công!", null));
    }

    private String resolveEmail(CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUsername() != null) {
            return userDetails.getUsername();
        }
        return SecurityUtils.getCurrentUserEmail();
    }
}
