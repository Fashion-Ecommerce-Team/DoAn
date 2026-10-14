package ecommerce.admin.dto.response;
import lombok.Data;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DashboardStatsResponse {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalUsers;
    private Long totalProducts;
}
