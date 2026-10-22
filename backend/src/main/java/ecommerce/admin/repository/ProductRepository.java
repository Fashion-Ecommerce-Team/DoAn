package ecommerce.admin.repository;

import ecommerce.admin.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR p.categoryId = :categoryId)")
    Page<Product> findProductsByFilter(@Param("keyword") String keyword, 
                                       @Param("categoryId") Long categoryId, 
                                       Pageable pageable);

    @Query(value = "SELECT p.id as id, p.name as name, p.base_price as price, SUM(od.quantity) as total_sold " +
            "FROM products p " +
            "JOIN product_variants pv ON p.id = pv.product_id " +
            "JOIN order_details od ON pv.id = od.product_variant_id " +
            "GROUP BY p.id, p.name, p.base_price " +
            "ORDER BY total_sold DESC " +
            "LIMIT 10", nativeQuery = true)
    List<Map<String, Object>> getTopSellingProducts();

    @Query("SELECT p.id FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :kw, '%'))")
    List<Long> findIdsByKeyword(@Param("kw") String keyword);
}
