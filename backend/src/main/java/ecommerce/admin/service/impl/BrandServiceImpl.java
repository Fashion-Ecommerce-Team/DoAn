package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.BrandRequest;
import ecommerce.admin.dto.response.BrandResponse;
import ecommerce.admin.entity.Brand;
import ecommerce.admin.repository.BrandRepository;
import ecommerce.admin.service.CloudinaryService;
import ecommerce.admin.service.BrandService;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;

import org.springframework.beans.BeanUtils;

@Service
public class BrandServiceImpl implements BrandService {
    @Autowired
    private BrandRepository repository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Override
    public PageResponse<BrandResponse> getList(String search, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Brand> spec = Specification.where(null);
        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
        }
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        Page<Brand> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    public BrandResponse getById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public BrandResponse create(BrandRequest request) {
        if (request.getName() != null
                && repository.existsByNameIgnoreCaseAndStatusNot(request.getName().trim(), "DELETED")) {
            throw new IllegalArgumentException("Tên thương hiệu '" + request.getName().trim() + "' đã tồn tại");
        }
        Brand entity = new Brand();
        BeanUtils.copyProperties(request, entity);
        if (request.getName() != null) {
            entity.setName(formatName(request.getName().trim()));
        }
        entity.setSlug(generateSlug(request.getName().trim()));
        entity.setStatus("ACTIVE"); // Default status
        return mapToResponse(repository.save(entity));
    }

    @Override
    public BrandResponse update(Long id, BrandRequest request) {
        Brand entity = findById(id);
        if (request.getName() != null
                && repository.existsByNameIgnoreCaseAndIdNotAndStatusNot(request.getName().trim(), id, "DELETED")) {
            throw new IllegalArgumentException("Tên thương hiệu '" + request.getName().trim() + "' đã tồn tại");
        }
        BeanUtils.copyProperties(request, entity, "id", "createdAt", "updatedAt");
        if (request.getName() != null) {
            entity.setName(formatName(request.getName().trim()));
        }
        entity.setSlug(generateSlug(request.getName().trim()));
        return mapToResponse(repository.save(entity));
    }

    @Override
    public void updateStatus(Long id, String status) {
        Brand entity = findById(id);
        entity.setStatus(status);
        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);
    }

    @Override
    public void delete(Long id) {
        Brand entity = findById(id);
        entity.setStatus("DELETED");
        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);
    }

    private Brand findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id " + id));
    }

    private BrandResponse mapToResponse(Brand entity) {
        BrandResponse response = new BrandResponse();
        BeanUtils.copyProperties(entity, response);
        return response;
    }

    private String generateSlug(String slugString) {
        if (slugString == null || slugString.isBlank()) {
            return "";
        }

        String slug = Normalizer.normalize(slugString, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        return slug;
    }

    private String formatName(String name) {
        String[] formattedName = name.trim().toLowerCase().split("\\s+");
        for (int i = 0; i < formattedName.length; i++) {
            formattedName[i] = Character.toUpperCase(formattedName[i].charAt(0)) + formattedName[i].substring(1);
        }
        return String.join(" ", formattedName);
    }
}
