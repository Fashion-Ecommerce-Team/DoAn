package ecommerce.admin.service;

import ecommerce.admin.dto.request.CategoryRequest;
import ecommerce.admin.dto.response.CategoryResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CategoryService {
    PageResponse<CategoryResponse> getList(String search, String status, int page, int size);
    CategoryResponse getById(Long id);
    CategoryResponse create(CategoryRequest request);
    CategoryResponse update(Long id, CategoryRequest request);
    void updateStatus(Long id, String status);
    void delete(Long id);
}
