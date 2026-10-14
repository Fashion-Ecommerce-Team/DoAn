package ecommerce.admin.service.impl;

import ecommerce.admin.dto.response.ReviewResponse;
import ecommerce.admin.entity.Product;
import ecommerce.admin.entity.ProductImage;
import ecommerce.admin.entity.Review;
import ecommerce.admin.entity.User;
import ecommerce.admin.repository.ProductImageRepository;
import ecommerce.admin.repository.ProductRepository;
import ecommerce.admin.repository.ReviewRepository;
import ecommerce.admin.repository.UserRepository;
import ecommerce.admin.service.ReviewService;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.beans.BeanUtils;

import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {
    @Autowired
    private ReviewRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Override
    public PageResponse<ReviewResponse> getList(String search, String status, Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Review> spec = Specification.where(null);

        if (search != null && !search.trim().isEmpty()) {
            String cleanSearch = search.trim();
            String keyword = "%" + cleanSearch.toLowerCase() + "%";

            // Tìm user IDs và product IDs khớp với từ khóa
            List<Long> matchedUserIds = userRepository.findIdsByKeyword(cleanSearch);
            List<Long> matchedProductIds = productRepository.findIdsByKeyword(cleanSearch);

            spec = spec.and((root, query, cb) -> {
                Predicate commentMatch = cb.and(
                    cb.isNotNull(root.get("comment")),
                    cb.like(cb.lower(root.get("comment")), keyword)
                );

                Predicate sentimentMatch = cb.and(
                    cb.isNotNull(root.get("sentimentLabel")),
                    cb.like(cb.lower(root.get("sentimentLabel")), keyword)
                );

                Predicate userMatch = (!matchedUserIds.isEmpty()) 
                    ? root.get("userId").in(matchedUserIds) 
                    : cb.disjunction();

                Predicate productMatch = (!matchedProductIds.isEmpty()) 
                    ? root.get("productId").in(matchedProductIds) 
                    : cb.disjunction();

                return cb.or(commentMatch, sentimentMatch, userMatch, productMatch);
            });
        }

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status.trim()));
        }

        if (productId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("productId"), productId));
        }

        Page<Review> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    public ReviewResponse getById(Long id) { 
        return mapToResponse(findById(id)); 
    }

    @Override
    public void updateStatus(Long id, String status) {
        Review entity = findById(id);
        entity.setStatus(status);
        repository.save(entity);
    }

    @Override
    public void delete(Long id) {
        Review entity = findById(id);
        repository.delete(entity);
    }

    private Review findById(Long id) { 
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dữ liệu với: " + id)); 
    }

    private ReviewResponse mapToResponse(Review entity) {
        ReviewResponse response = new ReviewResponse();
        BeanUtils.copyProperties(entity, response);

        // Nạp thông tin người dùng
        if (entity.getUserId() != null) {
            userRepository.findById(entity.getUserId()).ifPresent(u -> {
                response.setUserName(u.getFullName());
                response.setUserEmail(u.getEmail());
                response.setUserAvatar(u.getAvatarUrl());
            });
        }

        // Nạp thông tin sản phẩm
        if (entity.getProductId() != null) {
            productRepository.findById(entity.getProductId()).ifPresent(p -> {
                response.setProductName(p.getName());
            });
            List<ProductImage> images = productImageRepository.findByProductId(entity.getProductId());
            if (images != null && !images.isEmpty()) {
                response.setProductImage(images.get(0).getImageUrl());
            }
        }

        return response;
    }
}
