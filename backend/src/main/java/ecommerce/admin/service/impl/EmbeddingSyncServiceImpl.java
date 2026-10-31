package ecommerce.admin.service.impl;

import ecommerce.admin.client.AiEmbeddingClient;
import ecommerce.admin.client.QdrantClient;
import ecommerce.admin.dto.response.EmbeddingLogResponse;
import ecommerce.admin.entity.EmbeddingSyncLog;
import ecommerce.admin.entity.Product;
import ecommerce.admin.entity.ProductImage;
import ecommerce.admin.repository.*;
import ecommerce.admin.service.EmbeddingSyncService;
import ecommerce.common.constant.EntityStatus;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class EmbeddingSyncServiceImpl implements EmbeddingSyncService {

    @Autowired private EmbeddingSyncLogRepository logRepo;
    @Autowired private ProductRepository productRepo;
    @Autowired private ProductImageRepository imageRepo;
    @Autowired private CategoryRepository categoryRepo;
    @Autowired private BrandRepository brandRepo;
    @Autowired private ProductVariantRepository variantRepo;
    @Autowired private AiEmbeddingClient ai;
    @Autowired private QdrantClient qdrant;

    @Value("${embedding.model-version}")
    private String modelVersion;

    @Override
    public PageResponse<EmbeddingLogResponse> getList(String status, Long productId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return PageResponse.of(logRepo.filter(status, productId, pageable).map(EmbeddingLogResponse::from));
    }

    @Override
    public Map<String, Object> getStatus() {
        long totalProducts = productRepo.count();
        long syncedProducts = logRepo.countSyncedProducts();
        long successPoints = logRepo.countByStatus("SUCCESS");
        long failedPoints = logRepo.countByStatus("FAILED");
        long pendingPoints = logRepo.countByStatus("PENDING");
        long noImageCount = logRepo.countByStatus("NO_IMAGE");
        long needsResyncCount = logRepo.countByNeedsResyncTrue();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalProducts", totalProducts);
        m.put("syncedProducts", syncedProducts);
        m.put("missingProducts", Math.max(0, totalProducts - syncedProducts));
        m.put("noImageProducts", noImageCount);
        m.put("needsResyncProducts", needsResyncCount);
        m.put("successPoints", successPoints);
        m.put("failedPoints", failedPoints);
        m.put("pendingPoints", pendingPoints);
        m.put("collection", qdrant.getCollection());
        m.put("modelVersion", modelVersion);
        return m;
    }

    @Override
    public Map<String, Object> syncProduct(Long productId) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm id=" + productId));

        if (product.getStatus() == EntityStatus.DELETED) {
            deleteProduct(productId);
            return Map.of("productId", productId, "status", "DELETED", "message", "Sản phẩm đã bị xóa");
        }

        List<ProductImage> images = imageRepo.findByProductId(productId);
        if (images == null || images.isEmpty()) {
            // Trường hợp 2: Sản phẩm chưa có ảnh -> ghi log NO_IMAGE, không đẩy vào Qdrant
            EmbeddingSyncLog noImgLog = logRepo.findByProductIdAndImageId(productId, null)
                    .orElseGet(() -> EmbeddingSyncLog.builder().productId(productId).build());
            noImgLog.setImageId(null);
            noImgLog.setQdrantPointId(null);
            noImgLog.setModelVersion(modelVersion);
            noImgLog.setEmbeddingType("IMAGE");
            noImgLog.setStatus("NO_IMAGE");
            noImgLog.setNeedsResync(false);
            noImgLog.setErrorMessage("Sản phẩm chưa có ảnh trong hệ thống");
            noImgLog.setSyncedAt(null);
            logRepo.save(noImgLog);

            return Map.of("productId", productId, "images", 0, "status", "NO_IMAGE",
                    "message", "Sản phẩm chưa có ảnh, chưa thể tạo vector embedding");
        }

        // Nếu trước đó có log NO_IMAGE thì xóa đi vì giờ đã có ảnh
        logRepo.findByProductIdAndImageId(productId, null).ifPresent(l -> logRepo.delete(l));

        qdrant.ensureCollection();
        int ok = 0;
        int fail = 0;
        for (ProductImage img : images) {
            if (syncImage(product, img)) {
                ok++;
            } else {
                fail++;
            }
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("productId", productId);
        res.put("totalImages", images.size());
        res.put("successImages", ok);
        res.put("failedImages", fail);
        return res;
    }

    @Override
    public boolean syncSingleImage(Long productId, Long imageId) {
        try {
            Product product = productRepo.findById(productId).orElse(null);
            ProductImage img = imageRepo.findById(imageId).orElse(null);
            if (product == null || img == null) {
                return false;
            }
            if (product.getStatus() == EntityStatus.DELETED) {
                return false;
            }
            // Xóa log NO_IMAGE nếu có
            logRepo.findByProductIdAndImageId(productId, null).ifPresent(logRepo::delete);

            qdrant.ensureCollection();
            return syncImage(product, img);
        } catch (Exception e) {
            log.error("Lỗi khi sync single image id={}: {}", imageId, e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId) {
        try {
            qdrant.deleteByProductId(productId);
        } catch (Exception e) {
            log.warn("Không thể xóa point trong Qdrant cho product {}: {}", productId, e.getMessage());
        }
        logRepo.deleteByProductId(productId);
    }

    @Override
    @Transactional
    public void deleteImage(Long productId, Long imageId) {
        String pointId = generatePointId(productId, imageId);
        try {
            qdrant.deleteByPointId(pointId);
        } catch (Exception e) {
            log.warn("Không thể xóa point {} trong Qdrant: {}", pointId, e.getMessage());
        }
        logRepo.deleteByProductIdAndImageId(productId, imageId);
    }

    @Override
    public void refreshProductPayload(Long productId) {
        try {
            Product p = productRepo.findById(productId).orElse(null);
            if (p == null) {
                return;
            }
            if (p.getStatus() == EntityStatus.DELETED) {
                deleteProduct(productId);
                return;
            }

            List<EmbeddingSyncLog> logs = logRepo.findByProductId(productId);
            boolean hasSuccess = logs.stream().anyMatch(l -> "SUCCESS".equals(l.getStatus()));
            if (!hasSuccess) {
                return; // Chưa từng embed thành công thì không có point để update payload
            }

            // Gọi Qdrant set_payload
            qdrant.setPayloadByProductId(productId, buildProductPayload(p));

            // Thành công: xóa cờ needs_resync
            for (EmbeddingSyncLog l : logs) {
                if (Boolean.TRUE.equals(l.getNeedsResync())) {
                    l.setNeedsResync(false);
                    logRepo.save(l);
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi update payload Qdrant cho product {}: {}. Đánh dấu needs_resync=true", productId, e.getMessage());
            // Đánh dấu needs_resync để job D xử lý bù
            List<EmbeddingSyncLog> logs = logRepo.findByProductId(productId);
            for (EmbeddingSyncLog l : logs) {
                l.setNeedsResync(true);
                logRepo.save(l);
            }
        }
    }

    @Override
    public void refreshPayloadByCategory(Long categoryId, String categoryName) {
        try {
            // Lấy danh sách ID sản phẩm thuộc danh mục
            var products = productRepo.findAll().stream()
                    .filter(p -> categoryId != null && categoryId.equals(p.getCategoryId()))
                    .toList();
            for (Product p : products) {
                refreshProductPayload(p.getId());
            }
        } catch (Exception e) {
            log.error("Lỗi khi refresh payload theo category {}: {}", categoryId, e.getMessage());
        }
    }

    @Override
    public void refreshPayloadByBrand(Long brandId, String brandName) {
        try {
            var products = productRepo.findAll().stream()
                    .filter(p -> brandId != null && brandId.equals(p.getBrandId()))
                    .toList();
            for (Product p : products) {
                refreshProductPayload(p.getId());
            }
        } catch (Exception e) {
            log.error("Lỗi khi refresh payload theo brand {}: {}", brandId, e.getMessage());
        }
    }

    @Override
    public Map<String, Object> retryFailed() {
        Set<Long> productIds = new LinkedHashSet<>();
        // Sản phẩm bị FAILED
        logRepo.findByStatus("FAILED").forEach(l -> productIds.add(l.getProductId()));
        // Sản phẩm bị needs_resync
        logRepo.findByNeedsResyncTrue().forEach(l -> productIds.add(l.getProductId()));

        int ok = 0;
        int fail = 0;
        for (Long id : productIds) {
            try {
                syncProduct(id);
                refreshProductPayload(id);
                ok++;
            } catch (Exception e) {
                fail++;
            }
        }
        return Map.of("totalRetried", productIds.size(), "success", ok, "failed", fail);
    }

    @Override
    public Map<String, Object> qdrantInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        try {
            info.putAll(qdrant.info());
        } catch (Exception e) {
            info.put("error", e.getMessage());
        }
        info.put("collection", qdrant.getCollection());
        info.put("modelVersion", modelVersion);
        return info;
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    private boolean syncImage(Product product, ProductImage img) {
        EmbeddingSyncLog syncLog = logRepo.findByProductIdAndImageId(product.getId(), img.getId())
                .orElseGet(() -> EmbeddingSyncLog.builder()
                        .productId(product.getId())
                        .imageId(img.getId())
                        .build());

        String pointId = generatePointId(product.getId(), img.getId());
        syncLog.setQdrantPointId(pointId);
        syncLog.setModelVersion(modelVersion);
        syncLog.setEmbeddingType("IMAGE");
        syncLog.setStatus("PENDING");
        syncLog.setNeedsResync(false);
        syncLog.setErrorMessage(null);
        logRepo.save(syncLog);

        try {
            List<Double> vector = ai.embedImageUrl(img.getImageUrl());
            Map<String, Object> payload = buildPointPayload(product, img);
            qdrant.upsert(pointId, vector, payload);

            syncLog.setStatus("SUCCESS");
            syncLog.setSyncedAt(LocalDateTime.now());
            logRepo.save(syncLog);
            return true;
        } catch (Exception e) {
            log.error("Embed image failed for product={}, image={}: {}", product.getId(), img.getId(), e.getMessage());
            syncLog.setStatus("FAILED");
            String msg = e.getMessage();
            syncLog.setErrorMessage(msg != null && msg.length() > 1000 ? msg.substring(0, 1000) : msg);
            logRepo.save(syncLog);
            return false;
        }
    }

    private String generatePointId(Long productId, Long imageId) {
        return UUID.nameUUIDFromBytes(("product:" + productId + ":image:" + imageId)
                .getBytes(StandardCharsets.UTF_8)).toString();
    }

    /** Payload đầy đủ theo đặc tả của bạn cho Collection product_embeddings */
    private Map<String, Object> buildPointPayload(Product p, ProductImage img) {
        Map<String, Object> m = new LinkedHashMap<>(buildProductPayload(p));
        m.put("product_id", p.getId());
        m.put("image_id", img.getId());
        m.put("image_url", img.getImageUrl());
        m.put("is_primary", Boolean.TRUE.equals(img.getIsPrimary()));
        return m;
    }

    /** Các trường của sản phẩm dùng chung cho cả Point Payload và Qdrant set_payload */
    private Map<String, Object> buildProductPayload(Product p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("product_name", p.getName());
        m.put("product_slug", p.getSlug());
        m.put("base_price", p.getBasePrice() == null ? null : p.getBasePrice().doubleValue());
        m.put("discount_price", p.getDiscountPrice() == null ? null : p.getDiscountPrice().doubleValue());
        m.put("category_id", p.getCategoryId());
        m.put("category_name", p.getCategoryId() == null ? null
                : categoryRepo.findById(p.getCategoryId()).map(c -> c.getName()).orElse(null));
        m.put("brand_id", p.getBrandId());
        m.put("brand_name", p.getBrandId() == null ? null
                : brandRepo.findById(p.getBrandId()).map(b -> b.getName()).orElse(null));
        m.put("gender", p.getGender());
        m.put("tags", parseTags(p.getTags()));
        m.put("in_stock", isProductInStock(p.getId()));
        m.put("status", p.getStatus() == null ? "INACTIVE" : p.getStatus().name());
        return m;
    }

    private boolean isProductInStock(Long productId) {
        try {
            return variantRepo.findByProductId(productId).stream()
                    .anyMatch(v -> v.getStockQuantity() != null && v.getStockQuantity() > 0
                            && (v.getStatus() == null || v.getStatus() == EntityStatus.ACTIVE));
        } catch (Exception e) {
            return false;
        }
    }

    private List<String> parseTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
