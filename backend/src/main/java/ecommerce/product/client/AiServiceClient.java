package ecommerce.product.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${ai-service.url:http://localhost:8001}")
    private String aiServiceUrl;

    public AiServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductSyncItem {
        private Long id;
        private String name;
        private String imageUrl;
        private String category;
        private String brand;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiSearchResultItem {
        private Long productId;
        private Double similarity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiSearchResponse {
        private Boolean success;
        private String message;
        private Integer total;
        private List<AiSearchResultItem> results;
    }

    public boolean isAvailable() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(aiServiceUrl + "/health", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("AI service not reachable at {}: {}", aiServiceUrl, e.getMessage());
            return false;
        }
    }

    public void syncCatalog(List<ProductSyncItem> products) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Object> request = new HttpEntity<>(Collections.singletonMap("products", products), headers);
            restTemplate.postForEntity(aiServiceUrl + "/api/v1/ai/sync-catalog", request, String.class);
            log.info("Successfully synced {} products to Fashion-CLIP AI service.", products.size());
        } catch (Exception e) {
            log.warn("Failed to sync catalog to AI service: {}", e.getMessage());
        }
    }

    public List<AiSearchResultItem> searchByImage(byte[] imageBytes, String filename, String imageUrl, List<Long> candidateIds, int topK) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            if (imageBytes != null && imageBytes.length > 0) {
                ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                    @Override
                    public String getFilename() {
                        return filename != null ? filename : "query_image.jpg";
                    }
                };
                body.add("file", resource);
            }
            if (imageUrl != null && !imageUrl.isBlank()) {
                body.add("imageUrl", imageUrl);
            }
            if (candidateIds != null && !candidateIds.isEmpty()) {
                String ids = candidateIds.stream().map(String::valueOf).collect(Collectors.joining(","));
                body.add("candidateIds", ids);
            }
            body.add("topK", String.valueOf(topK));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<AiSearchResponse> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/v1/ai/search/image",
                    requestEntity,
                    AiSearchResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().getResults() != null) {
                return response.getBody().getResults();
            }
        } catch (Exception e) {
            log.error("Error calling AI service searchByImage: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    public List<AiSearchResultItem> searchHybrid(byte[] imageBytes, String filename, String imageUrl, String keyword, double imageWeight, List<Long> candidateIds, int topK) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            if (imageBytes != null && imageBytes.length > 0) {
                ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                    @Override
                    public String getFilename() {
                        return filename != null ? filename : "query_image.jpg";
                    }
                };
                body.add("file", resource);
            }
            if (imageUrl != null && !imageUrl.isBlank()) {
                body.add("imageUrl", imageUrl);
            }
            if (keyword != null && !keyword.isBlank()) {
                body.add("keyword", keyword);
            }
            body.add("imageWeight", String.valueOf(imageWeight));
            if (candidateIds != null && !candidateIds.isEmpty()) {
                String ids = candidateIds.stream().map(String::valueOf).collect(Collectors.joining(","));
                body.add("candidateIds", ids);
            }
            body.add("topK", String.valueOf(topK));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<AiSearchResponse> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/v1/ai/search/hybrid",
                    requestEntity,
                    AiSearchResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().getResults() != null) {
                return response.getBody().getResults();
            }
        } catch (Exception e) {
            log.error("Error calling AI service searchHybrid: {}", e.getMessage());
        }
        return Collections.emptyList();
    }
}
