package ecommerce.product.repository;

import ecommerce.product.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {
    List<SearchLog> findByUserIdOrderByCreatedAtDesc(Long userId);
}
