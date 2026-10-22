package ecommerce.product;

import ecommerce.common.response.PageResponse;
import ecommerce.product.controller.ProductController;
import ecommerce.product.dto.ProductDetailResponse;
import ecommerce.product.dto.ProductFilterRequest;
import ecommerce.product.dto.ProductSummaryResponse;
import ecommerce.product.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private ecommerce.product.service.FashionClipService fashionClipService;

    @MockBean
    private ecommerce.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private ecommerce.security.CustomUserDetailsService customUserDetailsService;

    @Test
    void exploreProducts_Returns200WithPageResponse() throws Exception {
        ProductSummaryResponse item = ProductSummaryResponse.builder()
                .id(1L)
                .name("Áo thun thể thao Nike")
                .slug("ao-thun-the-thao-nike")
                .basePrice(new BigDecimal("300000"))
                .gender("MEN")
                .status("ACTIVE")
                .build();

        PageResponse<ProductSummaryResponse> pageResponse = PageResponse.<ProductSummaryResponse>builder()
                .content(List.of(item))
                .pageNo(0)
                .pageSize(12)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(productService.exploreProducts(any(ProductFilterRequest.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "12")
                        .param("gender", "MEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Áo thun thể thao Nike"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void searchProducts_Returns200WithMatchingItems() throws Exception {
        ProductSummaryResponse item = ProductSummaryResponse.builder()
                .id(1L)
                .name("Áo thun thể thao Nike")
                .slug("ao-thun-the-thao-nike")
                .basePrice(new BigDecimal("300000"))
                .build();

        PageResponse<ProductSummaryResponse> pageResponse = PageResponse.<ProductSummaryResponse>builder()
                .content(List.of(item))
                .pageNo(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(productService.searchProducts(any(ProductFilterRequest.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/products/search")
                        .param("keyword", "Nike")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Áo thun thể thao Nike"));
    }

    @Test
    void getProductById_Returns200WithDetails() throws Exception {
        ProductDetailResponse detail = ProductDetailResponse.builder()
                .id(1L)
                .name("Áo thun thể thao Nike")
                .slug("ao-thun-the-thao-nike")
                .basePrice(new BigDecimal("300000"))
                .discountPrice(new BigDecimal("250000"))
                .build();

        when(productService.getProductById(1L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.name").value("Áo thun thể thao Nike"));
    }

    @Test
    void getProductBySlug_Returns200WithDetails() throws Exception {
        ProductDetailResponse detail = ProductDetailResponse.builder()
                .id(1L)
                .name("Áo thun thể thao Nike")
                .slug("ao-thun-the-thao-nike")
                .build();

        when(productService.getProductBySlug("ao-thun-the-thao-nike")).thenReturn(detail);

        mockMvc.perform(get("/api/v1/products/slug/ao-thun-the-thao-nike"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.slug").value("ao-thun-the-thao-nike"));
    }

    @Test
    void searchByImage_Returns200WithResults() throws Exception {
        ProductSummaryResponse item = ProductSummaryResponse.builder()
                .id(1L)
                .name("Áo thun thể thao Nike")
                .similarityScore(0.92)
                .build();

        PageResponse<ProductSummaryResponse> pageResponse = PageResponse.<ProductSummaryResponse>builder()
                .content(List.of(item))
                .pageNo(0)
                .pageSize(12)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(fashionClipService.searchByImage(any(), any(), any(), any())).thenReturn(pageResponse);

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "fake-image-bytes".getBytes()
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/products/search/image")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(1))
                .andExpect(jsonPath("$.data.content[0].similarityScore").value(0.92));
    }

    @Test
    void searchHybrid_Returns200WithResults() throws Exception {
        ProductSummaryResponse item = ProductSummaryResponse.builder()
                .id(2L)
                .name("Quần Jeans Đen")
                .similarityScore(0.88)
                .build();

        PageResponse<ProductSummaryResponse> pageResponse = PageResponse.<ProductSummaryResponse>builder()
                .content(List.of(item))
                .pageNo(0)
                .pageSize(12)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(fashionClipService.searchHybrid(any(), any(), any(), any(), any(), any())).thenReturn(pageResponse);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/products/search/hybrid")
                        .param("imageUrl", "https://example.com/test.jpg")
                        .param("keyword", "quan jeans mau den"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].id").value(2))
                .andExpect(jsonPath("$.data.content[0].similarityScore").value(0.88));
    }
}

