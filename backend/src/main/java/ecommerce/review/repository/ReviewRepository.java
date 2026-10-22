package ecommerce.review.repository;

import ecommerce.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductIdAndStatus(Long productId, String status, Pageable pageable);

    Page<Review> findByProductIdAndRatingAndStatus(Long productId, Integer rating, String status, Pageable pageable);

    Page<Review> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    List<Review> findByProductIdAndStatus(Long productId, String status);

    Optional<Review> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndProductIdAndStatus(Long userId, Long productId, String status);

    long countByProductIdAndStatus(Long productId, String status);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.status = 'PUBLISHED'")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.status = 'PUBLISHED' GROUP BY r.rating")
    List<Object[]> countRatingsGroupedByStars(@Param("productId") Long productId);
}
