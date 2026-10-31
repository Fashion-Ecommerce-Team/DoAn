package ecommerce.admin.service;

import ecommerce.admin.dto.response.EmbeddingLogResponse;
import ecommerce.common.response.PageResponse;

import java.util.Map;

public interface EmbeddingSyncService {

    PageResponse<EmbeddingLogResponse> getList(String status, Long productId, int page, int size);

    Map<String, Object> getStatus();

    Map<String, Object> syncProduct(Long productId);

    boolean syncSingleImage(Long productId, Long imageId);

    void deleteProduct(Long productId);

    void deleteImage(Long productId, Long imageId);

    void refreshProductPayload(Long productId);

    void refreshPayloadByCategory(Long categoryId, String categoryName);

    void refreshPayloadByBrand(Long brandId, String brandName);

    Map<String, Object> retryFailed();

    Map<String, Object> qdrantInfo();
}
