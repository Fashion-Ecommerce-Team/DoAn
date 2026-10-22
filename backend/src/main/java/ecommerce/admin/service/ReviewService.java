package ecommerce.admin.service;
import ecommerce.admin.dto.response.ReviewResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
public interface ReviewService {
    PageResponse<ReviewResponse> getList(String search, String status, Long productId, int page, int size);
    ReviewResponse getById(Long id);
    void updateStatus(Long id, String status);
    void delete(Long id);
}
