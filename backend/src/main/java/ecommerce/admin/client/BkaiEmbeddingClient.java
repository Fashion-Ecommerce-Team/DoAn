package ecommerce.admin.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Goi AI Service (FastAPI + BKAI Vietnamese Bi-Encoder) de lay vector 768 chieu cho Policy RAG.
 * Base URL mac dinh: http://localhost:8001/api/v1/bkai
 */
@Component
public class BkaiEmbeddingClient {

    private final RestClient rest;
    private final int expectedDimension;

    public BkaiEmbeddingClient(@Value("${ai.policy-service.url:http://localhost:8001/api/v1/bkai}") String baseUrl,
                               @Value("${qdrant.policy-vector-size:768}") int expectedDimension) {
        this.rest = RestClient.builder()
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory())
                .baseUrl(baseUrl)
                .build();
        this.expectedDimension = expectedDimension;
    }

    public int getExpectedDimension() {
        return expectedDimension;
    }

    public List<Double> embedText(String text) {
        Map<String, Object> res = rest.post().uri("/embed/text")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("text", text != null ? text : ""))
                .retrieve().body(Map.class);
        return extractEmbedding(res);
    }

    @SuppressWarnings("unchecked")
    public List<List<Double>> embedTexts(List<String> texts) {
        Map<String, Object> res = rest.post().uri("/embed/texts")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("texts", texts))
                .retrieve().body(Map.class);
        if (res == null || res.get("embeddings") == null) {
            throw new IllegalStateException("AI service khong tra ve truong 'embeddings'");
        }
        return (List<List<Double>>) res.get("embeddings");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getModelInfo() {
        try {
            return rest.get().uri("/info").retrieve().body(Map.class);
        } catch (Exception e) {
            return Map.of("status", "UNAVAILABLE", "error", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private List<Double> extractEmbedding(Map<String, Object> res) {
        if (res == null || res.get("embedding") == null) {
            throw new IllegalStateException("AI service khong tra ve truong 'embedding'");
        }
        List<Double> vector = ((List<Number>) res.get("embedding")).stream()
                .map(Number::doubleValue).toList();
        if (vector.size() != expectedDimension) {
            throw new IllegalStateException("So chieu vector BKAI sai: nhan " + vector.size()
                    + ", can " + expectedDimension);
        }
        return vector;
    }
}
