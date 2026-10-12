package ecommerce.wishlist;

import com.fasterxml.jackson.databind.ObjectMapper;
import ecommerce.common.response.PageResponse;
import ecommerce.wishlist.controller.WishlistController;
import ecommerce.wishlist.dto.WishlistItemResponse;
import ecommerce.wishlist.dto.WishlistRequest;
import ecommerce.wishlist.service.WishlistService;
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

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WishlistController.class)
@AutoConfigureMockMvc(addFilters = false)
class WishlistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WishlistService wishlistService;

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
    void getWishlist_Returns200() throws Exception {
        WishlistItemResponse item = WishlistItemResponse.builder()
                .wishlistId(1L)
                .productId(10L)
                .name("Áo Polo Nam")
                .basePrice(new BigDecimal("350000"))
                .build();

        PageResponse<WishlistItemResponse> pageResponse = PageResponse.<WishlistItemResponse>builder()
                .content(List.of(item))
                .pageNo(0)
                .pageSize(12)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(wishlistService.getWishlist("user@example.com", 0, 12)).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/wishlists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].productId").value(10))
                .andExpect(jsonPath("$.data.content[0].name").value("Áo Polo Nam"));
    }

    @Test
    void addToWishlist_Returns201() throws Exception {
        WishlistRequest request = WishlistRequest.builder().productId(10L).build();
        WishlistItemResponse response = WishlistItemResponse.builder()
                .wishlistId(1L)
                .productId(10L)
                .name("Áo Polo Nam")
                .build();

        when(wishlistService.addToWishlist("user@example.com", 10L)).thenReturn(response);

        mockMvc.perform(post("/api/v1/wishlists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.productId").value(10));
    }

    @Test
    void removeFromWishlist_Returns200() throws Exception {
        mockMvc.perform(delete("/api/v1/wishlists/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã xóa sản phẩm khỏi danh sách yêu thích!"));

        verify(wishlistService).removeFromWishlist("user@example.com", 10L);
    }

    @Test
    void checkWishlist_Returns200() throws Exception {
        when(wishlistService.isInWishlist("user@example.com", 10L)).thenReturn(true);

        mockMvc.perform(get("/api/v1/wishlists/check/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.inWishlist").value(true));
    }
}
