package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.BannerRequest;
import ecommerce.admin.dto.response.BannerResponse;
import ecommerce.admin.entity.Banner;
import ecommerce.admin.repository.BannerRepository;
import ecommerce.admin.service.BannerService;
import ecommerce.admin.service.CloudinaryService;
import ecommerce.common.constant.BannerPosition;
import ecommerce.common.constant.EntityStatus;
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
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BannerServiceImpl implements BannerService {
    @Autowired
    private BannerRepository repository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Override
    public PageResponse<BannerResponse> getList(String search, String status, String position, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Banner> spec = Specification.where(null);
        if (search != null && !search.isEmpty()) {
            spec = spec
                    .and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + search.toLowerCase() + "%"));
        }
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (position != null && !position.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("position"), position));
        }
        Page<Banner> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    public List<BannerResponse> getActiveByPosition(String position) {
        Specification<Banner> spec = (root, query, cb) -> cb.equal(root.get("status"), EntityStatus.ACTIVE);
        if (position != null && !position.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("position"), position.toUpperCase()));
        }
        return repository.findAll(spec, Sort.by("displayOrder").ascending().and(Sort.by("createdAt").descending()))
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public BannerResponse getById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    @Transactional
    public BannerResponse create(BannerRequest request) {
        Banner entity = new Banner();
        BeanUtils.copyProperties(request, entity, "displayOrder");
        applyDefaultsAndValidate(entity);
        validateDisplayOrder(request.getDisplayOrder());

        int order = request.getDisplayOrder() != null ? request.getDisplayOrder() : nextOrder(entity.getPosition());
        // Trùng thứ tự: đẩy các banner từ thứ tự này trở đi lên 1 bậc để chèn banner
        // mới vào
        shiftUpFrom(entity.getPosition(), order, null);
        entity.setDisplayOrder(order);
        return mapToResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public BannerResponse update(Long id, BannerRequest request) {
        Banner entity = findById(id);
        String oldPosition = entity.getPosition();
        Integer oldOrder = entity.getDisplayOrder();

        BeanUtils.copyProperties(request, entity, "id", "createdAt", "updatedAt", "displayOrder");
        applyDefaultsAndValidate(entity);
        validateDisplayOrder(request.getDisplayOrder());

        boolean samePosition = entity.getPosition().equals(oldPosition);
        int order;
        if (request.getDisplayOrder() != null) {
            order = request.getDisplayOrder();
        } else {
            // Không nhập thứ tự: giữ nguyên nếu cùng vị trí, ngược lại lấy thứ tự tiếp theo
            // của vị trí mới
            order = (samePosition && oldOrder != null) ? oldOrder : nextOrder(entity.getPosition());
        }

        if (samePosition && oldOrder != null) {
            if (order != oldOrder) {
                // Trùng thứ tự với banner khác: đổi chỗ 2 banner
                Banner other = findByPositionAndOrder(entity.getPosition(), order, entity.getId());
                if (other != null) {
                    other.setDisplayOrder(oldOrder);
                    repository.save(other);
                }
            }
        } else {
            // Đổi sang vị trí khác (hoặc dữ liệu cũ chưa có thứ tự): chèn vào vị trí đích
            shiftUpFrom(entity.getPosition(), order, entity.getId());
        }
        entity.setDisplayOrder(order);
        return mapToResponse(repository.save(entity));
    }

    @Override
    public void updateStatus(Long id, String status) {
        if (!EntityStatus.ACTIVE.name().equalsIgnoreCase(status)
                && !EntityStatus.INACTIVE.name().equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("Trạng thái banner không hợp lệ: " + status);
        }
        Banner entity = findById(id);
        entity.setStatus(status.toUpperCase());
        repository.save(entity);
    }

    @Override
    public void delete(Long id) {
        Banner entity = findById(id);
        if (entity.getCloudinaryPublicId() != null && !entity.getCloudinaryPublicId().isEmpty()) {
            cloudinaryService.deleteImage(entity.getCloudinaryPublicId());
        }
        repository.delete(entity);
    }

    /** Gán giá trị mặc định và kiểm tra position/status hợp lệ. */
    private void applyDefaultsAndValidate(Banner entity) {
        if (entity.getPosition() == null || entity.getPosition().trim().isEmpty()) {
            entity.setPosition(BannerPosition.HERO.name());
        } else {
            BannerPosition position = BannerPosition.fromString(entity.getPosition());
            if (position == null) {
                throw new IllegalArgumentException("Vị trí banner không hợp lệ: " + entity.getPosition()
                        + ". Chỉ chấp nhận: HERO, SIDEBAR, FOOTER");
            }
            entity.setPosition(position.name());
        }
        if (entity.getStatus() == null || entity.getStatus().trim().isEmpty()) {
            entity.setStatus(EntityStatus.ACTIVE.name());
        } else if (EntityStatus.ACTIVE.name().equalsIgnoreCase(entity.getStatus())
                || EntityStatus.INACTIVE.name().equalsIgnoreCase(entity.getStatus())) {
            entity.setStatus(entity.getStatus().toUpperCase());
        } else {
            throw new IllegalArgumentException("Trạng thái banner không hợp lệ: " + entity.getStatus());
        }
    }

    private void validateDisplayOrder(Integer displayOrder) {
        if (displayOrder != null && displayOrder < 1) {
            throw new IllegalArgumentException("Thứ tự hiển thị phải là số nguyên lớn hơn hoặc bằng 1");
        }
    }

    /**
     * Thứ tự tiếp theo = thứ tự lớn nhất hiện có trong cùng vị trí + 1 (chưa có
     * banner nào thì là 1).
     */
    private int nextOrder(String position) {
        Specification<Banner> spec = (root, query, cb) -> cb.equal(root.get("position"), position);
        Page<Banner> top = repository.findAll(spec, PageRequest.of(0, 1, Sort.by("displayOrder").descending()));
        if (top.isEmpty() || top.getContent().get(0).getDisplayOrder() == null) {
            return 1;
        }
        return top.getContent().get(0).getDisplayOrder() + 1;
    }

    private Banner findByPositionAndOrder(String position, int order, Long excludeId) {
        Specification<Banner> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("position"), position),
                cb.equal(root.get("displayOrder"), order),
                cb.notEqual(root.get("id"), excludeId));
        return repository.findAll(spec).stream().findFirst().orElse(null);
    }

    /**
     * Nếu thứ tự {@code order} đã tồn tại trong vị trí này thì đẩy các banner có
     * thứ tự >= order lên 1 bậc.
     */
    private void shiftUpFrom(String position, int order, Long excludeId) {
        if (findByPositionAndOrder(position, order, excludeId == null ? -1L : excludeId) == null) {
            return;
        }
        Specification<Banner> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("position"), position),
                cb.greaterThanOrEqualTo(root.get("displayOrder"), order),
                cb.notEqual(root.get("id"), excludeId == null ? -1L : excludeId));
        List<Banner> toShift = repository.findAll(spec);
        toShift.forEach(b -> b.setDisplayOrder(b.getDisplayOrder() + 1));
        repository.saveAll(toShift);
    }

    private Banner findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Banner not found"));
    }

    private BannerResponse mapToResponse(Banner entity) {
        BannerResponse response = new BannerResponse();
        BeanUtils.copyProperties(entity, response);
        return response;
    }
}
