package ecommerce.admin.repository;

import ecommerce.admin.entity.EmbeddingSyncLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmbeddingSyncLogRepository extends JpaRepository<EmbeddingSyncLog, Long> {

    Optional<EmbeddingSyncLog> findByProductIdAndImageId(Long productId, Long imageId);

    List<EmbeddingSyncLog> findByProductId(Long productId);

    List<EmbeddingSyncLog> findByStatus(String status);

    List<EmbeddingSyncLog> findByNeedsResyncTrue();

    long countByStatus(String status);

    long countByNeedsResyncTrue();

    @Transactional
    @Modifying
    @Query("DELETE FROM EmbeddingSyncLog l WHERE l.productId = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    @Transactional
    @Modifying
    @Query("DELETE FROM EmbeddingSyncLog l WHERE l.productId = :productId AND l.imageId = :imageId")
    void deleteByProductIdAndImageId(@Param("productId") Long productId, @Param("imageId") Long imageId);

    @Query("SELECT l FROM EmbeddingSyncLog l WHERE " +
           "(:status IS NULL OR :status = '' OR l.status = :status) AND " +
           "(:productId IS NULL OR l.productId = :productId)")
    Page<EmbeddingSyncLog> filter(@Param("status") String status,
                                  @Param("productId") Long productId,
                                  Pageable pageable);

    @Query("SELECT COUNT(DISTINCT l.productId) FROM EmbeddingSyncLog l WHERE l.status = 'SUCCESS'")
    long countSyncedProducts();
}
