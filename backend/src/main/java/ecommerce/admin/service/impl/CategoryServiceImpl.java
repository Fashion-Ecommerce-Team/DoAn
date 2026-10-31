package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.CategoryRequest;
import ecommerce.admin.dto.response.CategoryResponse;
import ecommerce.admin.entity.Category;
import ecommerce.admin.repository.CategoryRepository;
import ecommerce.admin.service.CategoryService;
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

import org.springframework.beans.BeanUtils;

@Service
public class CategoryServiceImpl implements CategoryService {
    @Autowired
    private CategoryRepository repository;

    @Autowired
    private ecommerce.admin.service.EmbeddingSyncService embeddingSyncService;

        @Override
    public PageResponse<CategoryResponse> getList(String search, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Category> spec = Specification.where(null);
        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
        }
        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        Page<Category> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    public CategoryResponse getById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public CategoryResponse create(CategoryRequest request) {
        if (request.getName() != null
                && repository.existsByNameIgnoreCaseAndStatusNot(request.getName().trim(), "DELETED")) {
            throw new IllegalArgumentException("Tên danh mục '" + request.getName().trim() + "' đã tồn tại");
        }
        Category entity = new Category();
        BeanUtils.copyProperties(request, entity);
        if (request.getName() != null) {
            entity.setName(formatName(request.getName().trim()));
        }
        entity.setSlug(generateSlug(request.getName().trim()));
        entity.setStatus("ACTIVE"); // Default status
        return mapToResponse(repository.save(entity));
    }

    @Override
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category entity = findById(id);
        if (request.getName() != null
                && repository.existsByNameIgnoreCaseAndIdNotAndStatusNot(request.getName().trim(), id, "DELETED")) {
            throw new IllegalArgumentException("Tên danh mục '" + request.getName().trim() + "' đã tồn tại");
        }
        BeanUtils.copyProperties(request, entity, "id", "createdAt", "updatedAt");
        if (request.getName() != null) {
            entity.setName(formatName(request.getName().trim()));
        }
        entity.setSlug(generateSlug(request.getName().trim()));
        entity.setUpdatedAt(java.time.LocalDateTime.now());
        Category saved = repository.save(entity);
        try { embeddingSyncService.refreshPayloadByCategory(id, saved.getName()); } catch (Exception ignored) {}
        return mapToResponse(saved);
    }

    @Override
    public void updateStatus(Long id, String status) {
        Category entity = findById(id);
        entity.setStatus(status);
        entity.setUpdatedAt(java.time.LocalDateTime.now());
        repository.save(entity);
    }

    @Override
    public void delete(Long id) {
        Category entity = findById(id);
        entity.setStatus("DELETED");
        entity.setUpdatedAt(java.time.LocalDateTime.now());
        repository.save(entity);
    }

    private Category findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu với id " + id));
    }

    private CategoryResponse mapToResponse(Category entity) {
        CategoryResponse response = new CategoryResponse();
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
