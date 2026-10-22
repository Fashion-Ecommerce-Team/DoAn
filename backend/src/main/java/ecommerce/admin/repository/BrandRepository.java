package ecommerce.admin.repository;

import ecommerce.admin.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long>, JpaSpecificationExecutor<Brand> {
    boolean existsByNameIgnoreCaseAndStatusNot(String name, String status);
    boolean existsByNameIgnoreCaseAndIdNotAndStatusNot(String name, Long id, String status);
}
