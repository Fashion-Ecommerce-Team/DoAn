package ecommerce.brand.service;

import ecommerce.brand.dto.BrandResponse;
import ecommerce.brand.entity.Brand;
import ecommerce.brand.repository.BrandRepository;
import ecommerce.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BrandService {

    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> getActiveBrands() {
        return brandRepository.findByStatusOrderByNameAsc("ACTIVE").stream()
                .map(BrandResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BrandResponse getBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với ID: " + id));
        return BrandResponse.fromEntity(brand);
    }

    @Transactional(readOnly = true)
    public BrandResponse getBrandBySlug(String slug) {
        Brand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu với slug: " + slug));
        return BrandResponse.fromEntity(brand);
    }
}
