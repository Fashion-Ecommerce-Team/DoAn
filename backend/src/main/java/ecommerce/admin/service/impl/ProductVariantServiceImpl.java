package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.ProductVariantRequest;
import ecommerce.admin.dto.response.ProductVariantResponse;
import ecommerce.admin.entity.ProductVariant;
import ecommerce.admin.repository.ProductVariantRepository;
import ecommerce.admin.service.EmbeddingSyncService;
import ecommerce.admin.service.ProductVariantService;
import ecommerce.common.constant.EntityStatus;
import ecommerce.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;

@Service
@RequiredArgsConstructor
public class ProductVariantServiceImpl implements ProductVariantService {
    private final ProductVariantRepository variantRepository;
    private final EmbeddingSyncService embeddingSyncService;

    @Override
    public ProductVariantResponse addVariant(Long productId, ProductVariantRequest request) {
        String size = request.getSize() != null ? request.getSize().trim() : "";
        String color = request.getColor() != null ? request.getColor().trim() : "";

        if (size.isEmpty() || color.isEmpty()) {
            throw new IllegalArgumentException("Kích cỡ và màu sắc không được để trống");
        }

        if (variantRepository.existsByProductIdAndSizeIgnoreCaseAndColorIgnoreCase(productId, size, color)) {
            throw new IllegalArgumentException(
                    String.format("Biến thể với kích cỡ '%s' và màu sắc '%s' đã tồn tại cho sản phẩm này", size, color));
        }

        String sku = request.getSku() != null && !request.getSku().trim().isEmpty()
                ? request.getSku().trim()
                : productId + "-" + size.toUpperCase() + "-" + generateSlug(color.toUpperCase());

        ProductVariant variant = ProductVariant.builder()
                .productId(productId)
                .size(size.toUpperCase())
                .color(formatName(color))
                .sku(sku)
                .priceAdjustment(request.getPriceAdjustment())
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .status(EntityStatus.ACTIVE)
                .build();

        ProductVariant saved = variantRepository.save(variant);

        // Cập nhật trường in_stock trong Qdrant
        embeddingSyncService.refreshProductPayload(productId);

        return mapToResponse(saved);
    }

    @Override
    public ProductVariantResponse updateVariant(Long variantId, ProductVariantRequest request) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể"));

        String size = request.getSize() != null ? request.getSize().trim() : "";
        String color = request.getColor() != null ? request.getColor().trim() : "";

        if (size.isEmpty() || color.isEmpty()) {
            throw new IllegalArgumentException("Kích cỡ và màu sắc không được để trống");
        }

        if (variantRepository.existsByProductIdAndSizeIgnoreCaseAndColorIgnoreCaseAndIdNot(variant.getProductId(), size,
                color, variantId)) {
            throw new IllegalArgumentException(
                    String.format("Biến thể với kích cỡ '%s' và màu sắc '%s' đã tồn tại cho sản phẩm này", size, color));
        }

        variant.setSize(size.toUpperCase());
        variant.setColor(formatName(color));
        if (request.getSku() != null && !request.getSku().trim().isEmpty()) {
            variant.setSku(request.getSku().trim());
        }
        variant.setPriceAdjustment(request.getPriceAdjustment());
        if (request.getStockQuantity() != null) {
            variant.setStockQuantity(request.getStockQuantity());
        }

        ProductVariant saved = variantRepository.save(variant);

        // Cập nhật trường in_stock trong Qdrant
        embeddingSyncService.refreshProductPayload(saved.getProductId());

        return mapToResponse(saved);
    }

    @Override
    public void deleteVariant(Long variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể"));
        Long productId = variant.getProductId();
        variantRepository.deleteById(variantId);

        // Cập nhật lại in_stock
        embeddingSyncService.refreshProductPayload(productId);
    }

    @Override
    public void toggleVariantStatus(Long variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu"));
        variant.setStatus(
                EntityStatus.ACTIVE.equals(variant.getStatus()) ? EntityStatus.INACTIVE : EntityStatus.ACTIVE);
        variantRepository.save(variant);

        // Cập nhật lại in_stock
        embeddingSyncService.refreshProductPayload(variant.getProductId());
    }

    private ProductVariantResponse mapToResponse(ProductVariant v) {
        ProductVariantResponse res = new ProductVariantResponse();
        res.setId(v.getId());
        res.setSize(v.getSize().toUpperCase());
        res.setColor(v.getColor());
        res.setStock(v.getStockQuantity());
        res.setStatus(EntityStatus.ACTIVE.equals(v.getStatus()));
        return res;
    }

    private String generateSlug(String slugString) {
        if (slugString == null || slugString.isBlank()) {
            return "";
        }

        return Normalizer.normalize(slugString, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private String formatName(String name) {
        String[] formattedName = name.trim().toLowerCase().split("\\s+");
        for (int i = 0; i < formattedName.length; i++) {
            formattedName[i] = Character.toUpperCase(formattedName[i].charAt(0)) + formattedName[i].substring(1);
        }
        return String.join(" ", formattedName);
    }
}
