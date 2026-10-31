package ecommerce.admin.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Goi AI Service (ai-service, FastAPI + FashionCLIP) de lay vector 512 chieu.
 * Base URL mac dinh: http://localhost:8001/api/v1/fashionclip
 * Ket qua tra ve: { success, dimension, embedding: [...] }
 */
@Component
public class AiEmbeddingClient {

    private final RestClient rest;
    private final int expectedDimension;

    public AiEmbeddingClient(@Value("${ai.service.url}") String baseUrl,
                             @Value("${qdrant.vector-size}") int expectedDimension) {
        this.rest = RestClient.builder().baseUrl(baseUrl).build();
        this.expectedDimension = expectedDimension;
    }

    public List<Double> embedImageUrl(String imageUrl) {
        Map<String, Object> res = rest.post().uri("/embed/image-url")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("imageUrl", imageUrl))
                .retrieve().body(Map.class);
        return extractEmbedding(res);
    }

    public List<Double> embedText(String text) {
        Map<String, Object> res = rest.post().uri("/embed/text")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("text", text))
                .retrieve().body(Map.class);
        return extractEmbedding(res);
    }

    public List<Double> embedImageFile(byte[] bytes, String filename) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });
        Map<String, Object> res = rest.post().uri("/embed/image")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve().body(Map.class);
        return extractEmbedding(res);
    }

    @SuppressWarnings("unchecked")
    private List<Double> extractEmbedding(Map<String, Object> res) {
        if (res == null || res.get("embedding") == null) {
            throw new IllegalStateException("AI service khong tra ve truong 'embedding'");
        }
        List<Double> vector = ((List<Number>) res.get("embedding")).stream()
                .map(Number::doubleValue).toList();
        if (vector.size() != expectedDimension) {
            throw new IllegalStateException("So chieu vector sai: nhan " + vector.size()
                    + ", can " + expectedDimension);
        }
        return vector;
    }
}
