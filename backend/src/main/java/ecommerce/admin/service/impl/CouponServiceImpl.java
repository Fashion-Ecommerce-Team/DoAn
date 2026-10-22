package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.CouponRequest;
import ecommerce.admin.dto.response.CouponResponse;
import ecommerce.admin.entity.Coupon;
import ecommerce.admin.repository.CouponRepository;
import ecommerce.admin.service.CouponService;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.beans.BeanUtils;

import ecommerce.common.constant.CouponStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class CouponServiceImpl implements CouponService {
    @Autowired
    private CouponRepository repository;

    @Override
    public PageResponse<CouponResponse> getList(String search, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Coupon> spec = Specification.where(null);
        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("code")), "%" + search.toLowerCase() + "%"));
        }
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        Page<Coupon> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::checkAndMapToResponse));
    }

    @Override
    public CouponResponse getById(Long id) { 
        return checkAndMapToResponse(findById(id)); 
    }

    @Override
    public CouponResponse create(CouponRequest request) {
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã giảm giá không được để trống");
        }
        String cleanCode = request.getCode().trim().toUpperCase();
        if (repository.existsByCodeIgnoreCaseAndStatusNot(cleanCode, "DELETED")) {
            throw new IllegalArgumentException("Mã giảm giá '" + cleanCode + "' đã tồn tại");
        }

        Coupon entity = new Coupon();
        BeanUtils.copyProperties(request, entity);
        entity.setCode(cleanCode);

        // Kiểm tra hạn sử dụng ngay khi tạo
        if (entity.getEndDate() != null && LocalDateTime.now().isAfter(entity.getEndDate())) {
            entity.setStatus(CouponStatus.EXPIRED.name());
        } else if (entity.getStatus() == null || entity.getStatus().trim().isEmpty()) {
            entity.setStatus(CouponStatus.ACTIVE.name());
        }

        if (entity.getUsedCount() == null) {
            entity.setUsedCount(0);
        }
        if (entity.getMinOrderValue() == null) {
            entity.setMinOrderValue(BigDecimal.ZERO);
        }
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }
        return mapToResponse(repository.save(entity));
    }

    @Override
    public CouponResponse update(Long id, CouponRequest request) {
        Coupon entity = findById(id);
        if (CouponStatus.DELETED.name().equalsIgnoreCase(entity.getStatus())) {
            throw new IllegalArgumentException("Mã giảm giá đã bị xóa, không thể chỉnh sửa!");
        }

        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            String cleanCode = request.getCode().trim().toUpperCase();
            if (repository.existsByCodeIgnoreCaseAndIdNotAndStatusNot(cleanCode, id, "DELETED")) {
                throw new IllegalArgumentException("Mã giảm giá '" + cleanCode + "' đã tồn tại");
            }
            entity.setCode(cleanCode);
        }

        BeanUtils.copyProperties(request, entity, "id", "createdAt", "usedCount", "code");

        // Đồng bộ lại trạng thái theo hạn sử dụng mới
        if (entity.getEndDate() != null && LocalDateTime.now().isAfter(entity.getEndDate())) {
            entity.setStatus(CouponStatus.EXPIRED.name());
        } else if (CouponStatus.EXPIRED.name().equalsIgnoreCase(entity.getStatus())) {
            // Nếu đã gia hạn ngày kết thúc thì chuyển về ACTIVE hoặc trạng thái người dùng chọn
            entity.setStatus(request.getStatus() != null ? request.getStatus() : CouponStatus.ACTIVE.name());
        }

        return mapToResponse(repository.save(entity));
    }

    @Override
    public void updateStatus(Long id, String status) {
        Coupon entity = findById(id);

        // 1. Không cho thay đổi trạng thái nếu mã đã bị xóa
        if (CouponStatus.DELETED.name().equalsIgnoreCase(entity.getStatus())) {
            throw new IllegalArgumentException("Mã giảm giá đã bị xóa, không thể thay đổi trạng thái!");
        }

        // 2. Không cho thay đổi trạng thái nếu mã đã hết hạn sử dụng
        if (entity.getEndDate() != null && LocalDateTime.now().isAfter(entity.getEndDate())) {
            entity.setStatus(CouponStatus.EXPIRED.name());
            repository.save(entity);
            throw new IllegalArgumentException("Mã giảm giá đã hết hạn sử dụng (ngày kết thúc đã qua), không thể đổi trạng thái!");
        }

        if (CouponStatus.EXPIRED.name().equalsIgnoreCase(entity.getStatus())) {
            throw new IllegalArgumentException("Mã giảm giá đã hết hạn sử dụng, không thể đổi trạng thái!");
        }

        entity.setStatus(status);
        repository.save(entity);
    }

    @Override
    public void delete(Long id) {
        Coupon entity = findById(id);
        entity.setStatus(CouponStatus.DELETED.name());
        repository.save(entity);
    }

    private Coupon findById(Long id) { 
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id " + id)); 
    }

    private CouponResponse checkAndMapToResponse(Coupon entity) {
        // Tự động cập nhật EXPIRED vào CSDL nếu đã quá hạn và chưa phải DELETED
        if (entity.getEndDate() != null && LocalDateTime.now().isAfter(entity.getEndDate())) {
            if (!CouponStatus.DELETED.name().equalsIgnoreCase(entity.getStatus()) 
                && !CouponStatus.EXPIRED.name().equalsIgnoreCase(entity.getStatus())) {
                entity.setStatus(CouponStatus.EXPIRED.name());
                entity = repository.save(entity);
            }
        }
        return mapToResponse(entity);
    }

    private CouponResponse mapToResponse(Coupon entity) {
        CouponResponse response = new CouponResponse();
        BeanUtils.copyProperties(entity, response);
        return response;
    }
}
