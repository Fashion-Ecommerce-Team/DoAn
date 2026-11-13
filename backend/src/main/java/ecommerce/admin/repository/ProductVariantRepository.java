package ecommerce.admin.repository;

import ecommerce.admin.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository("adminProductVariantRepository")
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductId(Long productId);
    boolean existsByProductIdAndSizeIgnoreCaseAndColorIgnoreCase(Long productId, String size, String color);
    boolean existsByProductIdAndSizeIgnoreCaseAndColorIgnoreCaseAndIdNot(Long productId, String size, String color, Long id);
}
