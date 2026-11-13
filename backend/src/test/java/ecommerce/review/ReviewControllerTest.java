package ecommerce.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import ecommerce.common.response.PageResponse;
import ecommerce.review.controller.ReviewController;
import ecommerce.review.dto.CreateReviewRequest;
import ecommerce.review.dto.ProductReviewSummaryResponse;
import ecommerce.review.dto.ReviewResponse;
import ecommerce.review.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReviewController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReviewService reviewService;

    @MockBean
    private ecommerce.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private ecommerce.security.CustomUserDetailsService customUserDetailsService;

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("user@example.com", null, null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void getProductReviews_Returns200WithSummary() throws Exception {
        ReviewResponse item = ReviewResponse.builder()
                .id(1L)
                .productId(10L)
                .productName("Áo Polo")
                .userId(1L)
                .userFullName("Nguyen Van A")
                .rating(5)
                .comment("Áo đẹp lắm")
                .sentimentLabel("POSITIVE")
                .isVerifiedPurchase(true)
                .status("PUBLISHED")
                .createdAt(LocalDateTime.now())
                .build();

        PageResponse<ReviewResponse> pageResponse = PageResponse.<ReviewResponse>builder()
                .content(List.of(item))
                .pageNo(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        ProductReviewSummaryResponse summary = ProductReviewSummaryResponse.builder()
                .averageRating(5.0)
                .totalReviews(1L)
                .ratingCounts(Map.of(5, 1L, 4, 0L, 3, 0L, 2, 0L, 1, 0L))
                .reviews(pageResponse)
                .build();

        when(reviewService.getProductReviews(eq(10L), any(), eq(0), eq(10), eq("createdAt"), eq("desc")))
                .thenReturn(summary);

        mockMvc.perform(get("/api/v1/products/10/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.averageRating").value(5.0))
                .andExpect(jsonPath("$.data.totalReviews").value(1))
                .andExpect(jsonPath("$.data.reviews.content[0].comment").value("Áo đẹp lắm"));
    }

    @Test
    void createReview_ValidRequest_Returns201() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .productId(10L)
                .rating(5)
                .comment("Rất hài lòng")
                .build();

        ReviewResponse response = ReviewResponse.builder()
                .id(2L)
                .productId(10L)
                .rating(5)
                .comment("Rất hài lòng")
                .sentimentLabel("POSITIVE")
                .isVerifiedPurchase(true)
                .status("PUBLISHED")
                .build();

        when(reviewService.createReview(eq("user@example.com"), any(CreateReviewRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(2))
                .andExpect(jsonPath("$.data.rating").value(5));
    }

    @Test
    void createReview_InvalidRating_Returns400() throws Exception {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .productId(10L)
                .rating(6) // Invalid rating > 5
                .comment("Sai số sao")
                .build();

        mockMvc.perform(post("/api/v1/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMyReviews_Returns200() throws Exception {
        PageResponse<ReviewResponse> pageResponse = PageResponse.<ReviewResponse>builder()
                .content(List.of())
                .pageNo(0)
                .pageSize(10)
                .totalElements(0)
                .totalPages(0)
                .last(true)
                .build();

        when(reviewService.getMyReviews(eq("user@example.com"), eq(0), eq(10)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/reviews/my-reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deleteReview_Returns200() throws Exception {
        mockMvc.perform(delete("/api/v1/reviews/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(reviewService).deleteReview("user@example.com", 1L);
    }
}
