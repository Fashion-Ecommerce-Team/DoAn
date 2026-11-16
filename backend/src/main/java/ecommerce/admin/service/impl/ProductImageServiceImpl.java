package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.ProductImageRequest;
import ecommerce.admin.dto.response.ProductImageResponse;
import ecommerce.admin.entity.ProductImage;
import ecommerce.admin.repository.ProductImageRepository;
import ecommerce.admin.service.CloudinaryService;
import ecommerce.admin.service.EmbeddingSyncService;
import ecommerce.admin.service.ProductImageService;
import ecommerce.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {
    private final ProductImageRepository imageRepository;
    private final CloudinaryService cloudinaryService;
    private final EmbeddingSyncService embeddingSyncService;

    @Override
    public ProductImageResponse addImage(Long productId, ProductImageRequest request) {
        ProductImage image = ProductImage.builder()
                .productId(productId)
                .imageUrl(request.getImageUrl())
                .cloudinaryPublicId(request.getCloudinaryPublicId())
                .isPrimary(false)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();
        ProductImage saved = imageRepository.save(image);

        // Hook tự động embed ảnh mới thêm
        embeddingSyncService.syncSingleImage(productId, saved.getId());

        return mapToResponse(saved);
    }

    @Override
    public List<ProductImageResponse> addImages(Long productId, List<ProductImageRequest> requests) {
        List<ProductImage> images = new ArrayList<>();
        for (ProductImageRequest request : requests) {
            ProductImage image = ProductImage.builder()
                    .productId(productId)
                    .imageUrl(request.getImageUrl())
                    .cloudinaryPublicId(request.getCloudinaryPublicId())
                    .isPrimary(false)
                    .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                    .build();
            images.add(image);
        }

        List<ProductImage> savedImages = imageRepository.saveAll(images);

        // Hook tự động embed các ảnh mới
        for (ProductImage img : savedImages) {
            embeddingSyncService.syncSingleImage(productId, img.getId());
        }

        return savedImages.stream().map(this::mapToResponse).toList();
    }

    @Override
    public ProductImageResponse updateImage(Long imageId, ProductImageRequest request) {
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu"));
        image.setImageUrl(request.getImageUrl());
        image.setCloudinaryPublicId(request.getCloudinaryPublicId());
        if (request.getDisplayOrder() != null) {
            image.setDisplayOrder(request.getDisplayOrder());
        }
        ProductImage saved = imageRepository.save(image);
        // Cập nhật lại vector nếu URL ảnh thay đổi
        embeddingSyncService.syncSingleImage(saved.getProductId(), saved.getId());

        return mapToResponse(saved);
    }

    @Override
    public void setPrimaryImage(Long imageId) {
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu"));
        Long productId = image.getProductId();
        List<ProductImage> allImages = imageRepository.findByProductId(productId);
        for (ProductImage img : allImages) {
            img.setIsPrimary(img.getId().equals(imageId));
        }
        imageRepository.saveAll(allImages);

        // Cập nhật lại payload is_primary trong Qdrant
        embeddingSyncService.refreshProductPayload(productId);
    }

    @Override
    public void deleteImage(Long imageId) {
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu"));
        if (image.getCloudinaryPublicId() != null && !image.getCloudinaryPublicId().isEmpty()) {
            cloudinaryService.deleteImage(image.getCloudinaryPublicId());
        }
        imageRepository.deleteById(imageId);

        // Hook xóa point khỏi Qdrant và DB log
        embeddingSyncService.deleteImage(image.getProductId(), imageId);
    }

    private ProductImageResponse mapToResponse(ProductImage i) {
        ProductImageResponse res = new ProductImageResponse();
        res.setId(i.getId());
        res.setUrl(i.getImageUrl());
        res.setIsPrimary(i.getIsPrimary());
        return res;
    }
}
