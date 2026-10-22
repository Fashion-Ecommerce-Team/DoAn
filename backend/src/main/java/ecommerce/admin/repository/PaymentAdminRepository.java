package ecommerce.admin.repository;

import ecommerce.admin.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository riêng cho trang quản trị thanh toán (hỗ trợ lọc động bằng Specification).
 * Tách riêng để không thay đổi PaymentRepository hiện có.
 */
@Repository
public interface PaymentAdminRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {
}
