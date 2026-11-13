package ecommerce.product.repository;

import ecommerce.product.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("productVariantCatalogRepository")
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProductIdAndStatus(Long productId, String status);

    List<ProductVariant> findByProductId(Long productId);

    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySku(String sku);
}
