package ecommerce.admin.repository;

import ecommerce.admin.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED'")
    Double calculateTotalRevenue();

    List<Order> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT o FROM Order o WHERE o.status = 'COMPLETED' AND o.createdAt >= :since")
    List<Order> findCompletedOrdersSince(@Param("since") LocalDateTime since);

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :since")
    List<Order> findOrdersSince(@Param("since") LocalDateTime since);

    // 1. Doanh thu theo thương hiệu
    @Query(value = "SELECT b.id as id, b.name as name, b.logo_url as logoUrl, " +
            "COALESCE(SUM(od.quantity * od.unit_price), 0) as revenue, " +
            "COALESCE(SUM(od.quantity), 0) as totalSold, " +
            "COUNT(DISTINCT o.id) as orderCount " +
            "FROM brands b " +
            "JOIN products p ON b.id = p.brand_id " +
            "JOIN product_variants pv ON p.id = pv.product_id " +
            "JOIN order_details od ON pv.id = od.product_variant_id " +
            "JOIN orders o ON od.order_id = o.id " +
            "WHERE o.status != 'CANCELLED' " +
            "GROUP BY b.id, b.name, b.logo_url " +
            "ORDER BY revenue DESC", nativeQuery = true)
    List<Map<String, Object>> getRevenueByBrand();

    // 2. Doanh thu theo danh mục
    @Query(value = "SELECT c.id as id, c.name as name, " +
            "COALESCE(SUM(od.quantity * od.unit_price), 0) as revenue, " +
            "COALESCE(SUM(od.quantity), 0) as totalSold, " +
            "COUNT(DISTINCT o.id) as orderCount " +
            "FROM categories c " +
            "JOIN products p ON c.id = p.category_id " +
            "JOIN product_variants pv ON p.id = pv.product_id " +
            "JOIN order_details od ON pv.id = od.product_variant_id " +
            "JOIN orders o ON od.order_id = o.id " +
            "WHERE o.status != 'CANCELLED' " +
            "GROUP BY c.id, c.name " +
            "ORDER BY revenue DESC", nativeQuery = true)
    List<Map<String, Object>> getRevenueByCategory();

    // 3. Mã giảm giá được dùng nhiều nhất
    @Query(value = "SELECT cp.id as id, cp.code as code, cp.description as description, " +
            "cp.discount_type as discountType, cp.discount_value as discountValue, " +
            "COUNT(o.id) as usageCount, " +
            "COALESCE(SUM(o.discount_amount), 0) as totalDiscountAmount, " +
            "COALESCE(SUM(o.total_amount), 0) as totalOrderAmount " +
            "FROM coupons cp " +
            "JOIN orders o ON cp.id = o.coupon_id " +
            "WHERE o.status != 'CANCELLED' " +
            "GROUP BY cp.id, cp.code, cp.description, cp.discount_type, cp.discount_value " +
            "ORDER BY usageCount DESC", nativeQuery = true)
    List<Map<String, Object>> getTopCoupons();

    // 4. Tỷ lệ khách hàng quay lại (Thống kê đơn theo User)
    @Query(value = "SELECT o.user_id as userId, COALESCE(u.full_name, o.receiver_name) as fullName, " +
            "COALESCE(u.email, '---') as email, " +
            "COUNT(o.id) as orderCount, " +
            "COALESCE(SUM(o.total_amount), 0) as totalSpent " +
            "FROM orders o " +
            "LEFT JOIN users u ON o.user_id = u.id " +
            "WHERE o.status != 'CANCELLED' AND o.user_id IS NOT NULL " +
            "GROUP BY o.user_id, u.full_name, o.receiver_name, u.email " +
            "ORDER BY orderCount DESC", nativeQuery = true)
    List<Map<String, Object>> getCustomerOrderStats();

    // 5. Doanh thu theo phương thức thanh toán
    @Query(value = "SELECT p.payment_method as paymentMethod, " +
            "COUNT(p.id) as totalTransactions, " +
            "COALESCE(SUM(p.amount), 0) as totalRevenue, " +
            "COUNT(CASE WHEN p.payment_status IN ('PAID', 'SUCCESS', 'COMPLETED') THEN 1 END) as successfulTransactions, " +
            "COALESCE(SUM(CASE WHEN p.payment_status IN ('PAID', 'SUCCESS', 'COMPLETED') THEN p.amount ELSE 0 END), 0) as successfulRevenue " +
            "FROM payments p " +
            "GROUP BY p.payment_method " +
            "ORDER BY totalRevenue DESC", nativeQuery = true)
    List<Map<String, Object>> getPaymentMethodStats();

    // 6. Tổng quan hủy đơn & phân phối trạng thái đơn
    @Query(value = "SELECT " +
            "COUNT(o.id) as totalOrders, " +
            "COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) as cancelledOrders, " +
            "COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) as completedOrders, " +
            "COUNT(CASE WHEN o.status NOT IN ('CANCELLED', 'COMPLETED') THEN 1 END) as inProgressOrders, " +
            "COALESCE(SUM(CASE WHEN o.status = 'CANCELLED' THEN o.total_amount ELSE 0 END), 0) as cancelledRevenue, " +
            "COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.total_amount ELSE 0 END), 0) as completedRevenue " +
            "FROM orders o", nativeQuery = true)
    List<Map<String, Object>> getCancellationOverview();

    // Lý do hủy đơn
    @Query(value = "SELECT COALESCE(NULLIF(TRIM(o.cancel_reason), ''), 'Khách hàng hủy / Không nêu lý do') as reason, " +
            "COUNT(o.id) as count " +
            "FROM orders o " +
            "WHERE o.status = 'CANCELLED' " +
            "GROUP BY reason " +
            "ORDER BY count DESC", nativeQuery = true)
    List<Map<String, Object>> getCancellationReasons();
}
