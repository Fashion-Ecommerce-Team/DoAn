package ecommerce.category.repository;

import ecommerce.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("categoryCatalogRepository")
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByStatusOrderByNameAsc(String status);

    Optional<Category> findBySlug(String slug);

    Optional<Category> findBySlugAndStatus(String slug, String status);

    boolean existsBySlug(String slug);
}
