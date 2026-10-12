package ecommerce.product;

import ecommerce.brand.entity.Brand;
import ecommerce.category.entity.Category;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import ecommerce.product.dto.ProductDetailResponse;
import ecommerce.product.dto.ProductFilterRequest;
import ecommerce.product.dto.ProductSummaryResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.entity.ProductImage;
import ecommerce.product.entity.ProductVariant;
import ecommerce.product.repository.ProductRepository;
import ecommerce.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private Product product;
    private Category category;
    private Brand brand;

    @BeforeEach
    void setUp() {
        category = Category.builder()
                .id(1L)
                .name("Áo Nam")
                .slug("ao-nam")
                .status("ACTIVE")
                .build();

        brand = Brand.builder()
                .id(1L)
                .name("Nike")
                .slug("nike")
                .status("ACTIVE")
                .build();

        ProductVariant variant1 = ProductVariant.builder()
                .id(101L)
                .sku("TSHIRT-BLK-M")
                .size("M")
                .color("Black")
                .price(new BigDecimal("250000"))
                .stockQuantity(50)
                .status("ACTIVE")
                .build();

        ProductImage image1 = ProductImage.builder()
                .id(201L)
                .imageUrl("https://example.com/img1.jpg")
                .isPrimary(true)
                .displayOrder(0)
                .build();

        product = Product.builder()
                .id(1L)
                .name("Áo thun thể thao Nike Dry-Fit")
                .slug("ao-thun-the-thao-nike-dry-fit")
                .description("Chất liệu thoáng mát thấm hút mồ hôi")
                .basePrice(new BigDecimal("300000"))
                .discountPrice(new BigDecimal("250000"))
                .gender("MEN")
                .status("ACTIVE")
                .category(category)
                .brand(brand)
                .variants(new ArrayList<>(List.of(variant1)))
                .images(new ArrayList<>(List.of(image1)))
                .build();
    }

    @Test
    void exploreProducts_ReturnsPaginatedProducts() {
        Page<Product> page = new PageImpl<>(List.of(product));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ProductFilterRequest filter = ProductFilterRequest.builder()
                .page(0)
                .size(12)
                .gender("MEN")
                .build();

        PageResponse<ProductSummaryResponse> response = productService.exploreProducts(filter);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals(0, response.getPageNo());
        assertEquals("Áo thun thể thao Nike Dry-Fit", response.getContent().get(0).getName());
        assertEquals("https://example.com/img1.jpg", response.getContent().get(0).getPrimaryImageUrl());
        assertEquals(50, response.getContent().get(0).getTotalStock());
    }

    @Test
    void searchProducts_WithKeyword_ReturnsMatchingProducts() {
        Page<Product> page = new PageImpl<>(List.of(product));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ProductFilterRequest filter = ProductFilterRequest.builder()
                .keyword("Nike")
                .page(0)
                .size(10)
                .build();

        PageResponse<ProductSummaryResponse> response = productService.searchProducts(filter);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("ao-thun-the-thao-nike-dry-fit", response.getContent().get(0).getSlug());
    }

    @Test
    void getProductById_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDetailResponse response = productService.getProductById(1L);

        assertNotNull(response);
        assertEquals("Áo thun thể thao Nike Dry-Fit", response.getName());
        assertEquals(1, response.getVariants().size());
        assertEquals(1, response.getImages().size());
        assertEquals("TSHIRT-BLK-M", response.getVariants().get(0).getSku());
    }

    @Test
    void getProductById_NotFound_ThrowsException() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(999L));
    }

    @Test
    void getProductBySlug_Success() {
        when(productRepository.findBySlug("ao-thun-the-thao-nike-dry-fit")).thenReturn(Optional.of(product));

        ProductDetailResponse response = productService.getProductBySlug("ao-thun-the-thao-nike-dry-fit");

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    void getProductBySlug_NotFound_ThrowsException() {
        when(productRepository.findBySlug("unknown-slug")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductBySlug("unknown-slug"));
    }
}
