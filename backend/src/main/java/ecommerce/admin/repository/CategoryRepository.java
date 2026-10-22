package ecommerce.admin.repository;

import ecommerce.admin.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category> {
    boolean existsByNameIgnoreCaseAndStatusNot(String name, String status);
    boolean existsByNameIgnoreCaseAndIdNotAndStatusNot(String name, Long id, String status);
}
