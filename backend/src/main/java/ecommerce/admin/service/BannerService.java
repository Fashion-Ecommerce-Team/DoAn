package ecommerce.admin.service;
import ecommerce.admin.dto.request.BannerRequest;
import ecommerce.admin.dto.response.BannerResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
public interface BannerService {
    PageResponse<BannerResponse> getList(String search, String status, int page, int size);
    BannerResponse getById(Long id);
    BannerResponse create(BannerRequest request);
    BannerResponse update(Long id, BannerRequest request);
    void updateStatus(Long id, String status);
    void delete(Long id);
}
