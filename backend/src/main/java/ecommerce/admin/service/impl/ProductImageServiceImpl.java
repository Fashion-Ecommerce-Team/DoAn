package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.ProductImageRequest;
import ecommerce.admin.dto.response.ProductImageResponse;
import ecommerce.admin.entity.ProductImage;
import ecommerce.admin.repository.ProductImageRepository;
import ecommerce.admin.service.ProductImageService;
import ecommerce.admin.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ecommerce.common.exception.ResourceNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ProductImageServiceImpl implements ProductImageService {
    private final ProductImageRepository imageRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    public ProductImageResponse addImage(Long productId, ProductImageRequest request) {
        ProductImage image = ProductImage.builder()
                .productId(productId)
                .imageUrl(request.getImageUrl())
                .cloudinaryPublicId(request.getCloudinaryPublicId())
                .isPrimary(false)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)

                .build();
        return mapToResponse(imageRepository.save(image));
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
        return savedImages.stream().map(this::mapToResponse).toList();
    }

    @Override
    public ProductImageResponse updateImage(Long imageId, ProductImageRequest request) {
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu"));
        image.setImageUrl(request.getImageUrl());
        image.setCloudinaryPublicId(request.getCloudinaryPublicId());
        if (request.getDisplayOrder() != null)
            image.setDisplayOrder(request.getDisplayOrder());
        return mapToResponse(imageRepository.save(image));
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
    }

    @Override
    public void deleteImage(Long imageId) {
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu"));
        if (image.getCloudinaryPublicId() != null && !image.getCloudinaryPublicId().isEmpty()) {
            cloudinaryService.deleteImage(image.getCloudinaryPublicId());
        }
        imageRepository.deleteById(imageId);
    }

    private ProductImageResponse mapToResponse(ProductImage i) {
        ProductImageResponse res = new ProductImageResponse();
        res.setId(i.getId());
        res.setUrl(i.getImageUrl());
        res.setIsPrimary(i.getIsPrimary());
        return res;
    }

    
}
