package ecommerce.admin.service.impl;
import ecommerce.admin.dto.request.BannerRequest;
import ecommerce.admin.dto.response.BannerResponse;
import ecommerce.admin.entity.Banner;
import ecommerce.admin.repository.BannerRepository;
import ecommerce.admin.service.BannerService;
import ecommerce.admin.service.CloudinaryService;
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

@Service
public class BannerServiceImpl implements BannerService {
    @Autowired
    private BannerRepository repository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Override
    public PageResponse<BannerResponse> getList(String search, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Banner> spec = Specification.where(null);
        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + search.toLowerCase() + "%"));
        }
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        Page<Banner> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }
    @Override
    public BannerResponse getById(Long id) { return mapToResponse(findById(id)); }
    @Override
    public BannerResponse create(BannerRequest request) {
        Banner entity = new Banner();
        BeanUtils.copyProperties(request, entity);
        return mapToResponse(repository.save(entity));
    }
    @Override
    public BannerResponse update(Long id, BannerRequest request) {
        Banner entity = findById(id);
        BeanUtils.copyProperties(request, entity, "id", "createdAt", "updatedAt");
        return mapToResponse(repository.save(entity));
    }
    @Override
    public void updateStatus(Long id, String status) {
        Banner entity = findById(id);
        entity.setStatus(status);
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
    private Banner findById(Long id) { return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Banner not found")); }
    private BannerResponse mapToResponse(Banner entity) {
        BannerResponse response = new BannerResponse();
        BeanUtils.copyProperties(entity, response);
        return response;
    }
}
