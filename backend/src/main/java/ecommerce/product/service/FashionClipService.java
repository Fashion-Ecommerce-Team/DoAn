package ecommerce.product.service;

import ecommerce.common.exception.BadRequestException;
import ecommerce.common.response.PageResponse;
import ecommerce.product.client.AiServiceClient;
import ecommerce.product.dto.ProductFilterRequest;
import ecommerce.product.dto.ProductSummaryResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.entity.ProductImage;
import ecommerce.product.entity.SearchLog;
import ecommerce.product.repository.ProductRepository;
import ecommerce.product.repository.ProductSpecification;
import ecommerce.product.repository.SearchLogRepository;
import ecommerce.user.entity.User;
import ecommerce.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FashionClipService {

    private static final Logger log = LoggerFactory.getLogger(FashionClipService.class);

    private final ProductRepository productRepository;
    private final SearchLogRepository searchLogRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;

    public FashionClipService(ProductRepository productRepository,
                              SearchLogRepository searchLogRepository,
                              UserRepository userRepository,
                              AiServiceClient aiServiceClient) {
        this.productRepository = productRepository;
        this.searchLogRepository = searchLogRepository;
        this.userRepository = userRepository;
        this.aiServiceClient = aiServiceClient;
    }

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        // Initial sync of catalog to AI service
        syncCatalog();
    }

    public int syncCatalog() {
        try {
            List<Product> products = productRepository.findAll();
            List<AiServiceClient.ProductSyncItem> items = products.stream().map(p -> {
                String img = null;
                if (p.getImages() != null && !p.getImages().isEmpty()) {
                    img = p.getImages().stream()
                            .filter(i -> Boolean.TRUE.equals(i.getIsPrimary()))
                            .map(ProductImage::getImageUrl)
                            .findFirst()
                            .orElse(p.getImages().get(0).getImageUrl());
                }
                return AiServiceClient.ProductSyncItem.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .imageUrl(img)
                        .category(p.getCategory() != null ? p.getCategory().getName() : "")
                        .brand(p.getBrand() != null ? p.getBrand().getName() : "")
                        .build();
            }).toList();

            aiServiceClient.syncCatalog(items);
            return items.size();
        } catch (Exception e) {
            log.warn("Could not sync catalog to AI service: {}", e.getMessage());
            return 0;
        }
    }

    @Transactional
    public PageResponse<ProductSummaryResponse> searchByImage(
            MultipartFile file,
            String imageUrl,
            ProductFilterRequest filter,
            String userEmail) {

        byte[] bytes = extractBytes(file);
        String filename = file != null ? file.getOriginalFilename() : null;

        if ((bytes == null || bytes.length == 0) && (imageUrl == null || imageUrl.isBlank())) {
            throw new BadRequestException("Vui lòng tải lên file ảnh hoặc nhập đường dẫn ảnh (imageUrl)!");
        }

        // 1. Lấy candidate IDs theo bộ lọc (nếu có lọc theo danh mục, giá, thương hiệu...)
        List<Long> candidateIds = getFilteredProductIds(filter);

        int topK = 50;
        List<AiServiceClient.AiSearchResultItem> aiResults = aiServiceClient.searchByImage(
                bytes, filename, imageUrl, candidateIds, topK
        );

        // 2. Chuyển đổi thành ProductSummaryResponse theo thứ tự tương đồng Fashion-CLIP
        List<ProductSummaryResponse> content = mapAndRankProducts(aiResults, candidateIds, filter);

        // 3. Phân trang kết quả
        PageResponse<ProductSummaryResponse> pagedResponse = paginateResults(content, filter);

        // 4. Lưu log tìm kiếm
        saveSearchLog(userEmail, null, imageUrl != null ? imageUrl : (filename != null ? "[Uploaded File: " + filename + "]" : "image_search"), "IMAGE", pagedResponse.getTotalElements());

        return pagedResponse;
    }

    @Transactional
    public PageResponse<ProductSummaryResponse> searchHybrid(
            MultipartFile file,
            String imageUrl,
            String keyword,
            Double imageWeight,
            ProductFilterRequest filter,
            String userEmail) {

        byte[] bytes = extractBytes(file);
        String filename = file != null ? file.getOriginalFilename() : null;

        boolean hasImage = (bytes != null && bytes.length > 0) || (imageUrl != null && !imageUrl.isBlank());
        boolean hasText = (keyword != null && !keyword.isBlank());

        if (!hasImage && !hasText) {
            throw new BadRequestException("Tìm kiếm đa phương thức (Hybrid) yêu cầu ít nhất hình ảnh hoặc từ khóa văn bản!");
        }

        double weight = (imageWeight != null && imageWeight >= 0.0 && imageWeight <= 1.0) ? imageWeight : 0.6;

        List<Long> candidateIds = getFilteredProductIds(filter);

        int topK = 50;
        List<AiServiceClient.AiSearchResultItem> aiResults = aiServiceClient.searchHybrid(
                bytes, filename, imageUrl, keyword, weight, candidateIds, topK
        );

        List<ProductSummaryResponse> content = mapAndRankProducts(aiResults, candidateIds, filter);

        PageResponse<ProductSummaryResponse> pagedResponse = paginateResults(content, filter);

        saveSearchLog(userEmail, keyword, imageUrl != null ? imageUrl : (filename != null ? "[Uploaded File: " + filename + "]" : null), "HYBRID", pagedResponse.getTotalElements());

        return pagedResponse;
    }

    private List<Long> getFilteredProductIds(ProductFilterRequest filter) {
        if (filter == null) {
            return Collections.emptyList();
        }
        Specification<Product> spec = ProductSpecification.filter(filter);
        return productRepository.findAll(spec).stream().map(Product::getId).toList();
    }

    private List<ProductSummaryResponse> mapAndRankProducts(
            List<AiServiceClient.AiSearchResultItem> aiResults,
            List<Long> fallbackCandidateIds,
            ProductFilterRequest filter) {

        if (aiResults != null && !aiResults.isEmpty()) {
            List<Long> productIds = aiResults.stream().map(AiServiceClient.AiSearchResultItem::getProductId).toList();
            Map<Long, Double> scoreMap = aiResults.stream()
                    .collect(Collectors.toMap(
                            AiServiceClient.AiSearchResultItem::getProductId,
                            AiServiceClient.AiSearchResultItem::getSimilarity,
                            (s1, s2) -> s1
                    ));

            Map<Long, Product> productMap = productRepository.findAllById(productIds).stream()
                    .collect(Collectors.toMap(Product::getId, Function.identity()));

            List<ProductSummaryResponse> list = new ArrayList<>();
            for (Long pid : productIds) {
                Product p = productMap.get(pid);
                if (p != null) {
                    Double score = scoreMap.get(pid);
                    list.add(ProductSummaryResponse.fromEntityWithScore(p, score));
                }
            }
            return list;
        }

        // Fallback: nếu AI service tạm thời chưa sẵn sàng hoặc rỗng, trả về danh sách sản phẩm theo bộ lọc
        List<Long> idsToFetch = (fallbackCandidateIds != null && !fallbackCandidateIds.isEmpty())
                ? fallbackCandidateIds
                : productRepository.findAll().stream().map(Product::getId).toList();

        return productRepository.findAllById(idsToFetch).stream()
                .map(p -> ProductSummaryResponse.fromEntityWithScore(p, 0.75))
                .toList();
    }

    private PageResponse<ProductSummaryResponse> paginateResults(
            List<ProductSummaryResponse> list,
            ProductFilterRequest filter) {

        int page = (filter != null && filter.getPage() != null && filter.getPage() >= 0) ? filter.getPage() : 0;
        int size = (filter != null && filter.getSize() != null && filter.getSize() > 0) ? filter.getSize() : 12;

        int totalElements = list.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        if (totalPages == 0) totalPages = 1;

        int fromIndex = page * size;
        List<ProductSummaryResponse> pagedContent;
        if (fromIndex >= totalElements) {
            pagedContent = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + size, totalElements);
            pagedContent = list.subList(fromIndex, toIndex);
        }

        boolean isLast = (page + 1) >= totalPages;

        return PageResponse.<ProductSummaryResponse>builder()
                .content(pagedContent)
                .pageNo(page)
                .pageSize(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(isLast)
                .build();
    }

    private void saveSearchLog(String userEmail, String queryText, String queryImageUrl, String searchType, long resultCount) {
        try {
            User user = null;
            if (userEmail != null && !userEmail.isBlank()) {
                user = userRepository.findByEmail(userEmail).orElse(null);
            }

            SearchLog logEntry = SearchLog.builder()
                    .user(user)
                    .queryText(queryText)
                    .queryImageUrl(queryImageUrl)
                    .searchType(searchType)
                    .resultCount((int) resultCount)
                    .build();

            searchLogRepository.save(logEntry);
        } catch (Exception e) {
            log.warn("Could not save search log: {}", e.getMessage());
        }
    }

    private byte[] extractBytes(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Không thể đọc dữ liệu file ảnh: " + e.getMessage());
        }
    }
}
