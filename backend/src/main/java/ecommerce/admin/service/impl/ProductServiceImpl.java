package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.ProductRequest;
import ecommerce.admin.dto.response.ProductResponse;
import ecommerce.admin.dto.response.ProductImageResponse;
import ecommerce.admin.dto.response.ProductVariantResponse;
import ecommerce.admin.entity.Product;
import ecommerce.common.constant.EntityStatus;
import ecommerce.admin.repository.ProductRepository;
import ecommerce.admin.repository.ProductImageRepository;
import ecommerce.admin.repository.ProductVariantRepository;
import ecommerce.admin.service.ProductService;
import ecommerce.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import ecommerce.common.exception.ResourceNotFoundException;
import java.util.List;
import java.util.stream.Collectors;
import java.text.Normalizer;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    public PageResponse<ProductResponse> getAllProducts(
            String keyword, 
            Long categoryId, 
            String gender, 
            EntityStatus status, 
            java.math.BigDecimal minPrice, 
            java.math.BigDecimal maxPrice, 
            int page, 
            int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Product> productPage = productRepository.findProductsByFilter(
                keyword, categoryId, gender, status, minPrice, maxPrice, pageable);
        List<ProductResponse> content = productPage.getContent().stream().map(p -> {
            ProductResponse res = mapToResponse(p);
            List<ProductImageResponse> images = productImageRepository.findByProductId(p.getId()).stream().map(img -> {
                ProductImageResponse iRes = new ProductImageResponse();
                iRes.setId(img.getId());
                iRes.setUrl(img.getImageUrl());
                iRes.setImageUrl(img.getImageUrl());
                iRes.setIsPrimary(img.getIsPrimary());
                iRes.setDisplayOrder(img.getDisplayOrder());
                return iRes;
            }).toList();
            res.setImages(images);
            return res;
        }).toList();

        return PageResponse.<ProductResponse>builder()
                .content(content)
                .pageNo(productPage.getNumber())
                .pageSize(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    @Override
    public ProductResponse getProductById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        ProductResponse response = mapToResponse(p);

        List<ProductImageResponse> images = productImageRepository.findByProductId(id).stream().map(img -> {
            ProductImageResponse res = new ProductImageResponse();
            res.setId(img.getId());
            res.setUrl(img.getImageUrl());
            res.setIsPrimary(img.getIsPrimary());
            res.setDisplayOrder(img.getDisplayOrder());
            return res;
        }).collect(Collectors.toList());
        response.setImages(images);

        List<ProductVariantResponse> variants = productVariantRepository.findByProductId(id).stream().map(var -> {
            ProductVariantResponse res = new ProductVariantResponse();
            res.setId(var.getId());
            res.setSize(var.getSize());
            res.setColor(var.getColor());
            res.setStock(var.getStockQuantity());
            res.setStatus(EntityStatus.ACTIVE.equals(var.getStatus()));
            return res;
        }).collect(Collectors.toList());
        response.setVariants(variants);

        return response;
    }

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        Product p = Product.builder()
                .categoryId(request.getCategoryId())
                .brandId(request.getBrandId())
                .name(formatName(request.getName()))
                .slug(generateSlug(request.getName()))
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .basePrice(request.getBasePrice())
                .discountPrice(request.getDiscountPrice())
                .gender(request.getGender() != null ? request.getGender() : "UNISEX") // Default gender to "UNISEX" if
                                                                                      // not provided
                .tags(request.getTags())
                .viewCount(0)
                .status(EntityStatus.ACTIVE)

                .build();
        return mapToResponse(productRepository.save(p));
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        p.setCategoryId(request.getCategoryId());
        p.setBrandId(request.getBrandId());
        p.setName(formatName(request.getName()));
        p.setSlug(generateSlug(request.getName()));
        p.setDescription(request.getDescription());
        p.setShortDescription(request.getShortDescription());
        p.setBasePrice(request.getBasePrice());
        p.setDiscountPrice(request.getDiscountPrice());
        p.setGender(request.getGender());
        p.setTags(request.getTags());

        return mapToResponse(productRepository.save(p));
    }

    @Override
    public void toggleProductStatus(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        p.setStatus(EntityStatus.ACTIVE.equals(p.getStatus()) ? EntityStatus.INACTIVE : EntityStatus.ACTIVE);
        p.setUpdatedAt(LocalDateTime.now());
        productRepository.save(p);
    }

    @Override
    public void deleteProduct(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm"));
        p.setDeletedAt(LocalDateTime.now());
        p.setStatus(EntityStatus.DELETED);
        productRepository.save(p);
    }

    private ProductResponse mapToResponse(Product p) {
        ProductResponse res = new ProductResponse();
        res.setId(p.getId());
        res.setCategoryId(p.getCategoryId());
        res.setBrandId(p.getBrandId());
        res.setName(p.getName());
        res.setSlug(p.getSlug());
        res.setDescription(p.getDescription());
        res.setShortDescription(p.getShortDescription());
        res.setBasePrice(p.getBasePrice());
        res.setDiscountPrice(p.getDiscountPrice());
        res.setGender(p.getGender());
        res.setTags(p.getTags());
        res.setViewCount(p.getViewCount());
        res.setStatus(p.getStatus() != null ? p.getStatus().name() : null);
        res.setUpdatedAt(p.getUpdatedAt());
        res.setCreatedAt(p.getCreatedAt());
        return res;
    }

    private String generateSlug(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }

        String slug = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        return slug + "-" + System.currentTimeMillis();
    }

    private String formatName(String name) {
        String[] formattedName = name.trim().toLowerCase().split("\\s+");
        for (int i = 0; i < formattedName.length; i++) {
            formattedName[i] = Character.toUpperCase(formattedName[i].charAt(0)) + formattedName[i].substring(1);
        }
        return String.join(" ", formattedName);
    }
}
