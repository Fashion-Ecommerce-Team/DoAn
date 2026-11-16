package ecommerce.admin.service;

import ecommerce.admin.dto.request.ProductRequest;
import ecommerce.admin.dto.response.ProductResponse;
import ecommerce.common.constant.EntityStatus;
import ecommerce.common.response.PageResponse;
import java.math.BigDecimal;

public interface ProductService {
    PageResponse<ProductResponse> getAllProducts(
            String keyword, 
            Long categoryId, 
            String gender, 
            EntityStatus status, 
            BigDecimal minPrice, 
            BigDecimal maxPrice, 
            int page, 
            int size);

    ProductResponse getProductById(Long id);

    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(Long id, ProductRequest request);

    void toggleProductStatus(Long id);

    void deleteProduct(Long id);
}
