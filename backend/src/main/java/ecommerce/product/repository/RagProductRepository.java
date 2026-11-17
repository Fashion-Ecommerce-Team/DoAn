
package ecommerce.product.repository;

import ecommerce.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RagProductRepository extends JpaRepository<Product, Long> {

    @Query("""
        SELECT DISTINCT p
        FROM Product p
        LEFT JOIN FETCH p.category c
        LEFT JOIN FETCH p.brand b
        LEFT JOIN FETCH p.variants v
        WHERE p.status = 'ACTIVE'
          AND p.deletedAt IS NULL
          AND (c IS NULL OR c.status = 'ACTIVE')
          AND (b IS NULL OR b.status = 'ACTIVE')
          AND (v IS NULL OR v.status = 'ACTIVE')
        ORDER BY p.id DESC
        """)
    List<Product> findActiveProductsForRag();
}
