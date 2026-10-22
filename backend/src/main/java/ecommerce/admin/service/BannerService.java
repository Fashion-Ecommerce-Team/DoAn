package ecommerce.admin.service;
import ecommerce.admin.dto.request.BannerRequest;
import ecommerce.admin.dto.response.BannerResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
import java.util.List;
public interface BannerService {
    PageResponse<BannerResponse> getList(String search, String status, String position, int page, int size);
    List<BannerResponse> getActiveByPosition(String position);
    BannerResponse getById(Long id);
    BannerResponse create(BannerRequest request);
    BannerResponse update(Long id, BannerRequest request);
    void updateStatus(Long id, String status);
    void delete(Long id);
}
