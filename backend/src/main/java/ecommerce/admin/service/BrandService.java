package ecommerce.admin.service;

import ecommerce.admin.dto.request.BrandRequest;
import ecommerce.admin.dto.response.BrandResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface BrandService {
    PageResponse<BrandResponse> getList(String search, String status, int page, int size);
    BrandResponse getById(Long id);
    BrandResponse create(BrandRequest request);
    BrandResponse update(Long id, BrandRequest request);
    void updateStatus(Long id, String status);
    void delete(Long id);
}
