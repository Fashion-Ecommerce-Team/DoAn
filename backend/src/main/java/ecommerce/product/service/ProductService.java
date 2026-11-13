package ecommerce.product.service;

import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import ecommerce.product.dto.ProductDetailResponse;
import ecommerce.product.dto.ProductFilterRequest;
import ecommerce.product.dto.ProductSummaryResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.repository.ProductRepository;
import ecommerce.product.repository.ProductSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "basePrice", "discountPrice", "name", "id"
    );

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> exploreProducts(ProductFilterRequest filter) {
        Pageable pageable = createPageable(filter);
        Specification<Product> spec = ProductSpecification.filter(filter);

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<ProductSummaryResponse> content = productPage.getContent().stream()
                .map(ProductSummaryResponse::fromEntity)
                .toList();

        return PageResponse.<ProductSummaryResponse>builder()
                .content(content)
                .pageNo(productPage.getNumber())
                .pageSize(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryResponse> searchProducts(ProductFilterRequest filter) {
        // Reuse explore with specification matching keywords
        return exploreProducts(filter);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + id));
        return ProductDetailResponse.fromEntity(product);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với slug: " + slug));
        return ProductDetailResponse.fromEntity(product);
    }

    private Pageable createPageable(ProductFilterRequest filter) {
        int page = (filter.getPage() != null && filter.getPage() >= 0) ? filter.getPage() : 0;
        int size = (filter.getSize() != null && filter.getSize() > 0 && filter.getSize() <= 100) ? filter.getSize() : 12;

        String sortBy = filter.getSortBy();
        if (sortBy == null || !ALLOWED_SORT_FIELDS.contains(sortBy)) {
            sortBy = "createdAt";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(filter.getSortDir())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }
}
