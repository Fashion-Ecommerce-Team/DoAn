package ecommerce.admin.service.impl;

import ecommerce.admin.client.BkaiEmbeddingClient;
import ecommerce.admin.client.QdrantClient;
import ecommerce.admin.dto.request.PolicyDocumentRequest;
import ecommerce.admin.dto.response.PolicyChunkResponse;
import ecommerce.admin.dto.response.PolicyDocumentResponse;
import ecommerce.admin.entity.PolicyChunk;
import ecommerce.admin.entity.PolicyDocument;
import ecommerce.admin.repository.PolicyChunkRepository;
import ecommerce.admin.repository.PolicyDocumentRepository;
import ecommerce.admin.service.CloudinaryService;
import ecommerce.admin.service.PolicyService;
import ecommerce.admin.util.TextChunkerUtil;
import ecommerce.admin.util.TextExtractorUtil;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PolicyServiceImpl implements PolicyService {

    private final PolicyDocumentRepository documentRepository;
    private final PolicyChunkRepository chunkRepository;
    private final CloudinaryService cloudinaryService;
    private final BkaiEmbeddingClient bkaiEmbeddingClient;
    private final QdrantClient qdrantClient;

    @Value("${qdrant.policy-collection:policy_knowledge_base}")
    private String policyCollection;

    @Value("${qdrant.policy-vector-size:768}")
    private int vectorSize;

    @Override
    public PageResponse<PolicyDocumentResponse> getList(String search, String category, String status, int page,
            int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Specification<PolicyDocument> spec = (root, query, cb) -> {
            var predicates = cb.conjunction();
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("title")), keyword),
                        cb.like(cb.lower(root.get("slug")), keyword)));
            }
            if (category != null && !category.isBlank()) {
                predicates = cb.and(predicates, cb.equal(root.get("category"), category.trim()));
            }
            if (status != null && !status.isBlank()) {
                if ("ACTIVE".equalsIgnoreCase(status)) {
                    predicates = cb.and(predicates, cb.isTrue(root.get("isActive")));
                } else if ("INACTIVE".equalsIgnoreCase(status)) {
                    predicates = cb.and(predicates, cb.isFalse(root.get("isActive")));
                }
            }
            return predicates;
        };

        Page<PolicyDocument> pageResult = documentRepository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(PolicyDocumentResponse::from));
    }

    @Override
    public PolicyDocumentResponse getById(Long id) {
        PolicyDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu chính sách #" + id));
        PolicyDocumentResponse response = PolicyDocumentResponse.from(doc);
        List<PolicyChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(id);
        response.setChunks(chunks.stream().map(PolicyChunkResponse::from).toList());
        return response;
    }

    @Override
    @Transactional
    public PolicyDocumentResponse create(PolicyDocumentRequest request, MultipartFile file) {
        String title = request.getTitle() != null ? request.getTitle().trim() : "";
        if (title.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề chính sách không được để trống!");
        }

        if (documentRepository.existsByTitleIgnoreCase(title)) {
            throw new IllegalArgumentException("Chính sách với tiêu đề '" + title + "' đã tồn tại!");
        }

        String rawContent = request.getContent() != null ? request.getContent().trim() : "";
        String fileUrl = null;
        String fileName = null;

        // Xử lý nếu có file đính kèm
        if (file != null && !file.isEmpty()) {
            try {
                String extracted = TextExtractorUtil.extractText(file);
                if (extracted != null && !extracted.isBlank()) {
                    rawContent = extracted;
                }
                fileName = file.getOriginalFilename();
                Map<String, Object> uploadResult = cloudinaryService.uploadFile(file, "policy_documents");
                fileUrl = (String) uploadResult.get("secure_url");
            } catch (Exception e) {
                throw new RuntimeException("Xử lý file chính sách thất bại: " + e.getMessage());
            }
        }

        if (rawContent.isBlank()) {
            throw new IllegalArgumentException("Nội dung tài liệu chính sách không được để trống!");
        }

        PolicyDocument doc = PolicyDocument.builder()
                .title(title)
                .slug(generateSlug(title))
                .category(request.getCategory() != null ? request.getCategory() : "GENERAL")
                .content(rawContent)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .version(1)
                .chunkCount(0)
                .embeddingStatus("PENDING")
                .needsResync(false)
                .build();

        doc = documentRepository.save(doc);

        // Băm nhỏ văn bản (Chunking)
        processChunking(doc);

        // Tự động sinh vector bằng BKAI Bi-Encoder và nạp lên Qdrant
        try {
            syncEmbeddingInternal(doc.getId());
        } catch (Exception e) {
            log.error("Đồng bộ vector BKAI cho policy #{} thất bại: {}", doc.getId(), e.getMessage());
        }

        return getById(doc.getId());
    }

    @Override
    @Transactional
    public PolicyDocumentResponse update(Long id, PolicyDocumentRequest request, MultipartFile file) {
        PolicyDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu chính sách #" + id));

        String title = request.getTitle() != null ? request.getTitle().trim() : doc.getTitle();
        if (documentRepository.existsByTitleIgnoreCaseAndIdNot(title, id)) {
            throw new IllegalArgumentException("Tiêu đề '" + title + "' đã trùng với tài liệu khác!");
        }

        boolean contentChanged = false;
        doc.setTitle(title);
        doc.setSlug(generateSlug(title));
        if (request.getCategory() != null) {
            doc.setCategory(request.getCategory());
        }
        if (request.getIsActive() != null) {
            doc.setIsActive(request.getIsActive());
        }

        // Xử lý nếu có file mới
        if (file != null && !file.isEmpty()) {
            try {
                if (doc.getFileUrl() != null && !doc.getFileUrl().isBlank()) {
                    try {
                        String oldPublicId = cloudinaryService.extractPublicIdFromUrl(doc.getFileUrl());
                        if (oldPublicId != null) {
                            cloudinaryService.deleteFile(oldPublicId);
                        }
                    } catch (Exception ignored) {
                    }
                }

                String extracted = TextExtractorUtil.extractText(file);
                if (extracted != null && !extracted.isBlank()) {
                    doc.setContent(extracted);
                    contentChanged = true;
                }
                doc.setFileName(file.getOriginalFilename());
                Map<String, Object> uploadResult = cloudinaryService.uploadFile(file, "policy_documents");
                doc.setFileUrl((String) uploadResult.get("secure_url"));
            } catch (Exception e) {
                throw new RuntimeException("Xử lý file mới thất bại: " + e.getMessage());
            }
        } else if (request.getContent() != null && !request.getContent().trim().equals(doc.getContent())) {
            doc.setContent(request.getContent().trim());
            contentChanged = true;
        }

        if (contentChanged) {
            doc.setVersion(doc.getVersion() != null ? doc.getVersion() + 1 : 1);
            doc.setNeedsResync(false);

            // Xóa vector cũ trên Qdrant
            try {
                qdrantClient.deleteByFilter(policyCollection, "document_id", id);
            } catch (Exception ignored) {
            }

            // Xóa chunks cũ trong DB
            chunkRepository.deleteByDocumentId(id);

            // Cắt lại chunks mới
            processChunking(doc);

            // Đồng bộ lại vector BKAI
            try {
                syncEmbeddingInternal(id);
            } catch (Exception e) {
                log.error("Lỗi đồng bộ vector sau khi update policy #{}: {}", id, e.getMessage());
            }
        }

        documentRepository.save(doc);
        return getById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        PolicyDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu chính sách #" + id));

        // 1. Xóa các point vector trong Qdrant
        try {
            qdrantClient.deleteByFilter(policyCollection, "document_id", id);
        } catch (Exception e) {
            log.warn("Lỗi khi xóa points trên Qdrant cho policy #{}: {}", id, e.getMessage());
        }

        // 2. Xóa file gốc trên Cloudinary nếu có
        if (doc.getFileUrl() != null && !doc.getFileUrl().isBlank()) {
            try {
                String publicId = cloudinaryService.extractPublicIdFromUrl(doc.getFileUrl());
                if (publicId != null) {
                    cloudinaryService.deleteFile(publicId);
                }
            } catch (Exception e) {
                log.warn("Lỗi khi xóa file trên Cloudinary cho policy #{}: {}", id, e.getMessage());
            }
        }

        // 3. Xóa các record trong policy_chunks
        chunkRepository.deleteByDocumentId(id);

        // 4. Xóa PolicyDocument
        documentRepository.delete(doc);
    }

    @Override
    @Transactional
    public void updateStatus(Long id, Boolean isActive) {
        PolicyDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu chính sách #" + id));
        doc.setIsActive(isActive);
        documentRepository.save(doc);
    }

    @Override
    @Transactional
    public PolicyDocumentResponse syncEmbedding(Long id) {
        syncEmbeddingInternal(id);
        return getById(id);
    }

    @Override
    @Transactional
    public PolicyDocumentResponse deleteEmbedding(Long id) {
        PolicyDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu chính sách #" + id));

        // 1. Xóa vector points trong Qdrant
        try {
            qdrantClient.deleteByFilter(policyCollection, "document_id", id);
            log.info("Đã xóa vector trên Qdrant cho policy #{}", id);
        } catch (Exception e) {
            log.warn("Lỗi khi xóa vector trên Qdrant cho policy #{}: {}", id, e.getMessage());
        }

        // 2. Cập nhật các chunks trong DB về trạng thái chưa nạp
        List<PolicyChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(id);
        for (PolicyChunk chunk : chunks) {
            chunk.setQdrantPointId(null);
            chunk.setIsEmbedded(false);
        }
        chunkRepository.saveAll(chunks);

        // 3. Đánh dấu tài liệu cần sync lại
        doc.setEmbeddingStatus("PENDING");
        doc.setNeedsResync(true);
        documentRepository.save(doc);

        return getById(id);
    }

    @Override
    @Transactional
    public Map<String, Object> clearQdrantCollection() {
        log.info("Thực hiện làm sạch toàn bộ dữ liệu vector Qdrant cho Policy collection: {} (size: {})", policyCollection, vectorSize);

        // 1. Xóa và tái tạo lại collection trên Qdrant với vector size chuẩn của BKAI (768)
        try {
            qdrantClient.clearCollection(policyCollection, vectorSize);
            qdrantClient.createIndex(policyCollection, "document_id", "integer");
            qdrantClient.createIndex(policyCollection, "category", "keyword");
        } catch (Exception e) {
            log.error("Lỗi khi làm sạch collection Qdrant: {}", e.getMessage());
            throw new RuntimeException("Lỗi thao tác trên Qdrant: " + e.getMessage());
        }

        // 2. Reset trạng thái tất cả chunks trong database
        List<PolicyChunk> allChunks = chunkRepository.findAll();
        for (PolicyChunk chunk : allChunks) {
            chunk.setQdrantPointId(null);
            chunk.setIsEmbedded(false);
        }
        chunkRepository.saveAll(allChunks);

        // 3. Reset trạng thái tất cả tài liệu chính sách
        List<PolicyDocument> allDocs = documentRepository.findAll();
        for (PolicyDocument doc : allDocs) {
            doc.setEmbeddingStatus("PENDING");
            doc.setNeedsResync(true);
        }
        documentRepository.saveAll(allDocs);

        return Map.of(
                "success", true,
                "message", "Đã xóa toàn bộ vector trên Qdrant và tái tạo collection: " + policyCollection,
                "collection", policyCollection,
                "vectorSize", vectorSize,
                "resetDocumentCount", allDocs.size(),
                "resetChunkCount", allChunks.size()
        );
    }

    @Override
    public Map<String, Object> getQdrantInfo() {
        qdrantClient.ensureCollection(policyCollection, vectorSize);
        Map<String, Object> info = new HashMap<>(qdrantClient.info(policyCollection));
        info.put("collection_name", policyCollection);
        info.put("vector_size", vectorSize);
        info.put("embedding_model", "bkai-foundation-models/vietnamese-bi-encoder");
        return info;
    }

    @Override
    @Transactional
    public Map<String, Object> syncAll() {
        List<PolicyDocument> activeDocs = documentRepository.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                .toList();

        int successDocs = 0;
        int failedDocs = 0;

        for (PolicyDocument doc : activeDocs) {
            try {
                syncEmbeddingInternal(doc.getId());
                successDocs++;
            } catch (Exception e) {
                log.error("Lỗi khi đồng bộ BKAI cho document #{}: {}", doc.getId(), e.getMessage());
                failedDocs++;
            }
        }

        return Map.of(
                "totalActive", activeDocs.size(),
                "successCount", successDocs,
                "failedCount", failedDocs,
                "collection", policyCollection,
                "model", "BKAI Bi-Encoder (768d)"
        );
    }

    private void syncEmbeddingInternal(Long documentId) {
        PolicyDocument doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null)
            return;

        List<PolicyChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(documentId);
        if (chunks.isEmpty()) {
            doc.setEmbeddingStatus("FAILED");
            documentRepository.save(doc);
            return;
        }

        qdrantClient.ensureCollection(policyCollection, vectorSize);
        qdrantClient.createIndex(policyCollection, "document_id", "integer");
        qdrantClient.createIndex(policyCollection, "category", "keyword");

        int successCount = 0;
        for (PolicyChunk chunk : chunks) {
            try {
                List<Double> vector = bkaiEmbeddingClient.embedText(chunk.getChunkText());
                String pointId = (chunk.getQdrantPointId() != null && !chunk.getQdrantPointId().isBlank())
                        ? chunk.getQdrantPointId()
                        : UUID.randomUUID().toString();

                Map<String, Object> payload = Map.of(
                        "document_id", documentId,
                        "title", doc.getTitle(),
                        "category", doc.getCategory() != null ? doc.getCategory() : "GENERAL",
                        "chunk_index", chunk.getChunkIndex(),
                        "content", chunk.getChunkText());

                qdrantClient.upsert(policyCollection, pointId, vector, payload);

                chunk.setQdrantPointId(pointId);
                chunk.setIsEmbedded(true);
                chunkRepository.saveAndFlush(chunk);
                successCount++;
            } catch (Exception e) {
                log.error("Lỗi khi embed chunk #{} của document #{}: {}", chunk.getChunkIndex(), documentId,
                        e.getMessage());
            }
        }

        if (successCount == chunks.size()) {
            doc.setEmbeddingStatus("SYNCED");
            doc.setNeedsResync(false);
        } else if (successCount > 0) {
            doc.setEmbeddingStatus("PARTIAL");
        } else {
            doc.setEmbeddingStatus("FAILED");
        }
        documentRepository.save(doc);
    }

    private void processChunking(PolicyDocument doc) {
        List<TextChunkerUtil.ChunkItem> chunkItems = TextChunkerUtil.chunkText(doc.getContent());
        List<PolicyChunk> chunksToSave = new ArrayList<>();

        for (TextChunkerUtil.ChunkItem item : chunkItems) {
            PolicyChunk chunk = PolicyChunk.builder()
                    .documentId(doc.getId())
                    .chunkText(item.getText())
                    .chunkIndex(item.getIndex())
                    .charStart(item.getCharStart())
                    .charEnd(item.getCharEnd())
                    .qdrantPointId(null)
                    .isEmbedded(false)
                    .build();
            chunksToSave.add(chunk);
        }

        chunkRepository.saveAll(chunksToSave);
        doc.setChunkCount(chunksToSave.size());
        documentRepository.save(doc);
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
}
