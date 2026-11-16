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
        RestClient.Builder b = RestClient.builder()
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory())
                .baseUrl(url);
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
        ensureCollection(collection, vectorSize);

        // Tao payload index phuc vu loc theo spec
        createIndex(collection, "product_id", "integer");
        createIndex(collection, "category_id", "integer");
        createIndex(collection, "category_name", "keyword");
        createIndex(collection, "brand_id", "integer");
        createIndex(collection, "brand_name", "keyword");
        createIndex(collection, "gender", "keyword");
        createIndex(collection, "in_stock", "bool");
        createIndex(collection, "status", "keyword");
    }

    /** Tao collection voi ten va vectorSize tuy chinh neu chua ton tai */
    public void ensureCollection(String customCollection, int size) {
        boolean exists;
        try {
            rest.get().uri("/collections/{c}", customCollection).retrieve().toBodilessEntity();
            exists = true;
        } catch (Exception e) {
            exists = false;
        }
        if (exists) {
            return;
        }
        rest.put().uri("/collections/{c}", customCollection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("vectors", Map.of("size", size, "distance", "Cosine")))
                .retrieve().toBodilessEntity();
    }

    public void createIndex(String customCollection, String field, String schema) {
        try {
            rest.put().uri("/collections/{c}/index", customCollection)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("field_name", field, "field_schema", schema))
                    .retrieve().toBodilessEntity();
        } catch (Exception ignored) {
        }
    }

    /** Upsert 1 vector va payload vao collection mac dinh */
    public void upsert(String pointId, List<Double> vector, Map<String, Object> payload) {
        upsert(collection, pointId, vector, payload);
    }

    /** Upsert 1 vector va payload vao collection tuy chon */
    public void upsert(String customCollection, String pointId, List<Double> vector, Map<String, Object> payload) {
        Map<String, Object> point = Map.of("id", pointId, "vector", vector, "payload", payload);
        rest.put().uri("/collections/{c}/points?wait=true", customCollection)
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
        deleteByFilter(collection, "product_id", productId);
    }

    /** Xoa cac points theo dieu kien filter trong collection tuy chon */
    public void deleteByFilter(String customCollection, String key, Object value) {
        Map<String, Object> filter = Map.of("must", List.of(
                Map.of("key", key, "match", Map.of("value", value))));
        rest.post().uri("/collections/{c}/points/delete?wait=true", customCollection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("filter", filter))
                .retrieve().toBodilessEntity();
    }

    /** Xoa 1 point khoi Qdrant theo pointId (UUID) */
    public void deleteByPointId(String pointId) {
        deleteByPointId(collection, pointId);
    }

    /** Xoa 1 point khoi collection tuy chon */
    public void deleteByPointId(String customCollection, String pointId) {
        rest.post().uri("/collections/{c}/points/delete?wait=true", customCollection)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("points", List.of(pointId)))
                .retrieve().toBodilessEntity();
    }

    /** Xoa toan bo collection khoi Qdrant */
    public void deleteCollection(String customCollection) {
        try {
            rest.delete().uri("/collections/{c}", customCollection).retrieve().toBodilessEntity();
        } catch (Exception ignored) {
        }
    }

    /** Xoa sach toan bo points bang cach recreate collection voi vectorSize moi */
    public void clearCollection(String customCollection, int size) {
        deleteCollection(customCollection);
        ensureCollection(customCollection, size);
    }

    /** Lay thong tin ve collection mac dinh */
    @SuppressWarnings("unchecked")
    public Map<String, Object> info() {
        return info(collection);
    }

    /** Lay thong tin ve collection tuy chon */
    @SuppressWarnings("unchecked")
    public Map<String, Object> info(String customCollection) {
        try {
            Map<String, Object> res = rest.get().uri("/collections/{c}", customCollection)
                    .retrieve().body(Map.class);
            return res != null && res.get("result") != null
                    ? (Map<String, Object>) res.get("result")
                    : Map.of();
        } catch (Exception e) {
            return Map.of("status", "NOT_FOUND", "message", e.getMessage());
        }
    }
}
