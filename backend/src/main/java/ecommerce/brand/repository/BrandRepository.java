package ecommerce.brand.repository;

import ecommerce.brand.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("brandCatalogRepository")
public interface BrandRepository extends JpaRepository<Brand, Long> {

    List<Brand> findByStatusOrderByNameAsc(String status);

    Optional<Brand> findBySlug(String slug);

    Optional<Brand> findBySlugAndStatus(String slug, String status);

    boolean existsBySlug(String slug);
}
