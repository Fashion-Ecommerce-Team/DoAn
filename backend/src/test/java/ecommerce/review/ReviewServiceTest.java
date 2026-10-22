package ecommerce.review;

import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.product.entity.Product;
import ecommerce.product.repository.ProductRepository;
import ecommerce.review.dto.CreateReviewRequest;
import ecommerce.review.dto.ProductReviewSummaryResponse;
import ecommerce.review.dto.ReviewResponse;
import ecommerce.review.entity.Review;
import ecommerce.review.repository.ReviewRepository;
import ecommerce.review.service.ReviewService;
import ecommerce.user.entity.User;
import ecommerce.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private ReviewService reviewService;

    private User user;
    private Product product;
    private Review review;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("user@example.com");
        user.setFullName("Nguyen Van A");

        product = Product.builder()
                .id(10L)
                .name("Áo Thun Nam")
                .slug("ao-thun-nam")
                .status("ACTIVE")
                .build();

        review = Review.builder()
                .id(100L)
                .user(user)
                .product(product)
                .rating(5)
                .comment("Chất lượng tuyệt vời")
                .sentimentLabel("POSITIVE")
                .isVerifiedPurchase(true)
                .status("PUBLISHED")
                .build();
    }

    @Test
    void getProductReviews_Success() {
        when(productRepository.findByIdAndStatus(10L, "ACTIVE")).thenReturn(Optional.of(product));

        Page<Review> page = new PageImpl<>(List.of(review));
        when(reviewRepository.findByProductIdAndStatus(eq(10L), eq("PUBLISHED"), any(Pageable.class)))
                .thenReturn(page);
        when(reviewRepository.findAverageRatingByProductId(10L)).thenReturn(4.8);
        when(reviewRepository.countByProductIdAndStatus(10L, "PUBLISHED")).thenReturn(1L);

        ProductReviewSummaryResponse result = reviewService.getProductReviews(10L, null, 0, 10, "createdAt", "desc");

        assertNotNull(result);
        assertEquals(4.8, result.getAverageRating());
        assertEquals(1, result.getTotalReviews());
        assertEquals(1, result.getReviews().getContent().size());
        assertEquals("Chất lượng tuyệt vời", result.getReviews().getContent().get(0).getComment());
    }

    @Test
    void createReview_Success() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .productId(10L)
                .rating(5)
                .comment("Rất đẹp")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findByIdAndStatus(10L, "ACTIVE")).thenReturn(Optional.of(product));
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(1L), eq(10L)))
                .thenReturn(1); // User purchased this product
        when(reviewRepository.save(any(Review.class))).thenReturn(review);

        ReviewResponse response = reviewService.createReview("user@example.com", request);

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("POSITIVE", response.getSentimentLabel());
        assertTrue(response.getIsVerifiedPurchase());
    }

    @Test
    void createReview_ProductNotFound_ThrowsException() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .productId(999L)
                .rating(5)
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findByIdAndStatus(999L, "ACTIVE")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                reviewService.createReview("user@example.com", request));
    }
}
