package ecommerce.admin.repository;

import ecommerce.admin.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long>, JpaSpecificationExecutor<Coupon> {
    boolean existsByCodeIgnoreCaseAndStatusNot(String code, String status);
    boolean existsByCodeIgnoreCaseAndIdNotAndStatusNot(String code, Long id, String status);
}
