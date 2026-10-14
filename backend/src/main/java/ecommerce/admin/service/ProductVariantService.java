package ecommerce.admin.service;

import ecommerce.admin.dto.request.ProductVariantRequest;
import ecommerce.admin.dto.response.ProductVariantResponse;

public interface ProductVariantService {
    ProductVariantResponse addVariant(Long productId, ProductVariantRequest request);

    ProductVariantResponse updateVariant(Long variantId, ProductVariantRequest request);

    void deleteVariant(Long variantId);

    void toggleVariantStatus(Long variantId);
}
