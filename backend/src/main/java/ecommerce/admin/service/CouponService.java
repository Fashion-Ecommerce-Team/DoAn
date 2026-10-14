package ecommerce.admin.service;
import ecommerce.admin.dto.request.CouponRequest;
import ecommerce.admin.dto.response.CouponResponse;
import ecommerce.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
public interface CouponService {
    PageResponse<CouponResponse> getList(String search, String status, int page, int size);
    CouponResponse getById(Long id);
    CouponResponse create(CouponRequest request);
    CouponResponse update(Long id, CouponRequest request);
    void updateStatus(Long id, String status);
    void delete(Long id);
}
