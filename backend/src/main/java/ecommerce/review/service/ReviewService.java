package ecommerce.review.service;

import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.repository.ProductRepository;
import ecommerce.review.dto.CreateReviewRequest;
import ecommerce.review.dto.ProductReviewSummaryResponse;
import ecommerce.review.dto.ReviewResponse;
import ecommerce.review.entity.Review;
import ecommerce.review.repository.ReviewRepository;
import ecommerce.user.entity.User;
import ecommerce.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public ReviewService(ReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         UserRepository userRepository,
                         JdbcTemplate jdbcTemplate) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public ProductReviewSummaryResponse getProductReviews(Long productId,
                                                          Integer rating,
                                                          int page,
                                                          int size,
                                                          String sortBy,
                                                          String sortDir) {
        // Kiểm tra sản phẩm tồn tại
        productRepository.findByIdAndStatus(productId, "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Review> reviewPage;
        if (rating != null && rating >= 1 && rating <= 5) {
            reviewPage = reviewRepository.findByProductIdAndRatingAndStatus(productId, rating, "PUBLISHED", pageable);
        } else {
            reviewPage = reviewRepository.findByProductIdAndStatus(productId, "PUBLISHED", pageable);
        }

        List<ReviewResponse> dtoList = reviewPage.getContent().stream()
                .map(ReviewResponse::fromEntity)
                .toList();

        PageResponse<ReviewResponse> pageResponse = PageResponse.<ReviewResponse>builder()
                .content(dtoList)
                .pageNo(reviewPage.getNumber())
                .pageSize(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .last(reviewPage.isLast())
                .build();

        // Tính điểm trung bình và thống kê số sao
        Double avg = reviewRepository.findAverageRatingByProductId(productId);
        double averageRating = (avg != null) ? Math.round(avg * 10.0) / 10.0 : 0.0;
        long totalReviews = reviewRepository.countByProductIdAndStatus(productId, "PUBLISHED");

        Map<Integer, Long> ratingCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingCounts.put(i, 0L);
        }

        List<Object[]> grouped = reviewRepository.countRatingsGroupedByStars(productId);
        if (grouped != null) {
            for (Object[] row : grouped) {
                if (row.length >= 2 && row[0] != null && row[1] != null) {
                    Integer star = ((Number) row[0]).intValue();
                    Long count = ((Number) row[1]).longValue();
                    ratingCounts.put(star, count);
                }
            }
        }

        return ProductReviewSummaryResponse.builder()
                .averageRating(averageRating)
                .totalReviews(totalReviews)
                .ratingCounts(ratingCounts)
                .reviews(pageResponse)
                .build();
    }

    @Transactional
    public ReviewResponse createReview(String email, CreateReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        Product product = productRepository.findByIdAndStatus(request.getProductId(), "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh với ID: " + request.getProductId()));

        // Kiểm tra xem người dùng đã từng mua sản phẩm này chưa (Verified Purchase)
        boolean isVerified = checkUserPurchasedProduct(user.getId(), product.getId(), request.getOrderDetailId());

        // Phân loại cảm xúc sơ bộ (Sentiment Analysis)
        String sentimentLabel = determineSentiment(request.getRating(), request.getComment());

        Review review = Review.builder()
                .user(user)
                .product(product)
                .orderDetailId(request.getOrderDetailId())
                .rating(request.getRating())
                .comment(request.getComment())
                .sentimentLabel(sentimentLabel)
                .isVerifiedPurchase(isVerified)
                .status("PUBLISHED")
                .build();

        Review saved = reviewRepository.save(review);
        return ReviewResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviewPage = reviewRepository.findByUserIdAndStatus(user.getId(), "PUBLISHED", pageable);

        List<ReviewResponse> list = reviewPage.getContent().stream()
                .map(ReviewResponse::fromEntity)
                .toList();

        return PageResponse.<ReviewResponse>builder()
                .content(list)
                .pageNo(reviewPage.getNumber())
                .pageSize(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .last(reviewPage.isLast())
                .build();
    }

    @Transactional
    public void deleteReview(String email, Long reviewId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId));

        boolean isOwner = review.getUser().getId().equals(user.getId());
        boolean isAdmin = user.getRole() != null && "ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName());

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Bạn không có quyền xóa đánh giá này!");
        }

        review.setStatus("DELETED");
        reviewRepository.save(review);
    }

    private boolean checkUserPurchasedProduct(Long userId, Long productId, Long orderDetailId) {
        try {
            if (orderDetailId != null) {
                Integer count = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*)
                    FROM orders o
                    JOIN order_details od ON o.id = od.order_id
                    WHERE o.user_id = ? AND od.id = ?
                    """, Integer.class, userId, orderDetailId);
                if (count != null && count > 0) {
                    return true;
                }
            }

            Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM orders o
                JOIN order_details od ON o.id = od.order_id
                JOIN product_variants pv ON od.product_variant_id = pv.id
                WHERE o.user_id = ? AND pv.product_id = ?
                """, Integer.class, userId, productId);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String determineSentiment(Integer rating, String comment) {
        if (rating == null) {
            return "NEUTRAL";
        }
        if (rating >= 4) {
            return "POSITIVE";
        } else if (rating == 3) {
            return "NEUTRAL";
        } else {
            return "NEGATIVE";
        }
    }
}
