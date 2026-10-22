package ecommerce.admin.service;

import ecommerce.admin.dto.request.ProductImageRequest;
import ecommerce.admin.dto.response.ProductImageResponse;
import java.util.List;

public interface ProductImageService {
    ProductImageResponse addImage(Long productId, ProductImageRequest request);
    
    List<ProductImageResponse> addImages(Long productId, List<ProductImageRequest> requests);

    ProductImageResponse updateImage(Long imageId, ProductImageRequest request);

    void setPrimaryImage(Long imageId);

    void deleteImage(Long imageId);
}

