package ecommerce.admin.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Goi REST API cua Qdrant danh cho Admin quan ly collection, points va payload.
 */
@Component
public class QdrantClient {

    private final RestClient rest;
    private final String collection;
    private final int vectorSize;

    public QdrantClient(@Value("${qdrant.url}") String url,
                        @Value("${qdrant.api-key:}") String apiKey,
                        @Value("${qdrant.collection}") String collection,
                        @Value("${qdrant.vector-size}") int vectorSize) {
        RestClient.Builder b = RestClient.builder().baseUrl(url);
        if (apiKey != null && !apiKey.isBlank()) {
            b.defaultHeader("api-key", apiKey);
        }
        this.rest = b.build();
        this.collection = collection;
        this.vectorSize = vectorSize;
    }

    public String getCollection() {
        return collection;
    }

    /** Tao collection (Cosine, 512 dimensions) + payload indexes neu chua ton tai. */
    public void ensureCollection() {
        boolean exists;
        try {
            rest.get().uri("/collections/{c}", collection).retrieve().toBodilessEntity();
            exists = true;
        } catch (Exception e) {
            exists = false;
        }
        if (exists) {
            return;
        }
        rest.put().uri("/collections/{c}", collection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("vectors", Map.of("size", vectorSize, "distance", "Cosine")))
                .retrieve().toBodilessEntity();

        // Tao payload index phuc vu loc theo spec
        createIndex("product_id", "integer");
        createIndex("category_id", "integer");
        createIndex("category_name", "keyword");
        createIndex("brand_id", "integer");
        createIndex("brand_name", "keyword");
        createIndex("gender", "keyword");
        createIndex("in_stock", "bool");
        createIndex("status", "keyword");
    }

    private void createIndex(String field, String schema) {
        try {
            rest.put().uri("/collections/{c}/index", collection)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("field_name", field, "field_schema", schema))
                    .retrieve().toBodilessEntity();
        } catch (Exception ignored) {
        }
    }

    /** Upsert 1 vector va payload */
    public void upsert(String pointId, List<Double> vector, Map<String, Object> payload) {
        Map<String, Object> point = Map.of("id", pointId, "vector", vector, "payload", payload);
        rest.put().uri("/collections/{c}/points?wait=true", collection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("points", List.of(point)))
                .retrieve().toBodilessEntity();
    }

    /** Cap nhat payload cho tat ca points cua mot san pham ma KHONG embed lai anh */
    public void setPayloadByProductId(Long productId, Map<String, Object> payload) {
        Map<String, Object> filter = Map.of("must", List.of(
                Map.of("key", "product_id", "match", Map.of("value", productId))));
        rest.post().uri("/collections/{c}/points/payload?wait=true", collection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("payload", payload, "filter", filter))
                .retrieve().toBodilessEntity();
    }

    /** Xoa tat ca points cua 1 san pham khoi Qdrant */
    public void deleteByProductId(Long productId) {
        Map<String, Object> filter = Map.of("must", List.of(
                Map.of("key", "product_id", "match", Map.of("value", productId))));
        rest.post().uri("/collections/{c}/points/delete?wait=true", collection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("filter", filter))
                .retrieve().toBodilessEntity();
    }

    /** Xoa 1 point khoi Qdrant theo pointId (UUID) */
    public void deleteByPointId(String pointId) {
        rest.post().uri("/collections/{c}/points/delete?wait=true", collection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("points", List.of(pointId)))
                .retrieve().toBodilessEntity();
    }

    /** Lay thong tin ve collection */
    @SuppressWarnings("unchecked")
    public Map<String, Object> info() {
        Map<String, Object> res = rest.get().uri("/collections/{c}", collection)
                .retrieve().body(Map.class);
        return (Map<String, Object>) res.get("result");
    }
}
