package ecommerce.admin.repository;

import ecommerce.admin.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED'")
    Double calculateTotalRevenue();

    List<Order> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT o FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :since")
    List<Order> findCompletedOrdersSince(@Param("since") LocalDateTime since);
}
