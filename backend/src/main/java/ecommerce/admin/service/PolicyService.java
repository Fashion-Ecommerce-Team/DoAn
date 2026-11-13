package ecommerce.admin.service;

import ecommerce.admin.dto.request.PolicyDocumentRequest;
import ecommerce.admin.dto.response.PolicyDocumentResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface PolicyService {

    PageResponse<PolicyDocumentResponse> getList(String search, String category, String status, int page, int size);

    PolicyDocumentResponse getById(Long id);

    PolicyDocumentResponse create(PolicyDocumentRequest request, MultipartFile file);

    PolicyDocumentResponse update(Long id, PolicyDocumentRequest request, MultipartFile file);

    void delete(Long id);

    void updateStatus(Long id, Boolean isActive);

    PolicyDocumentResponse syncEmbedding(Long id);

    PolicyDocumentResponse deleteEmbedding(Long id);

    Map<String, Object> clearQdrantCollection();

    Map<String, Object> getQdrantInfo();

    Map<String, Object> syncAll();
}
