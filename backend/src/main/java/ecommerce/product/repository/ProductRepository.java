package ecommerce.product.repository;

import ecommerce.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlug(String slug);

    Optional<Product> findBySlugAndStatus(String slug, String status);

    Optional<Product> findByIdAndStatus(Long id, String status);

    boolean existsBySlug(String slug);
}
