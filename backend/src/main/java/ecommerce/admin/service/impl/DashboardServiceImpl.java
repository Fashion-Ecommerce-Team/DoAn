package ecommerce.admin.service.impl;

import ecommerce.admin.repository.OrderRepository;
import ecommerce.admin.repository.ProductRepository;
import ecommerce.admin.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.util.*;
import ecommerce.admin.entity.Order;

import ecommerce.admin.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public Object getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", orderRepository.calculateTotalRevenue());
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("totalUsers", userRepository.count());
        return stats;
    }

    @Override
    public Object getRecentOrders() {
        return orderRepository.findTop10ByOrderByCreatedAtDesc();
    }

    @Override
    public Object getTopSelling() {
        return productRepository.getTopSellingProducts();
    }

    @Override
    public Object getRevenueChart(String period) {
        LocalDateTime startDate;
        LocalDateTime now = LocalDateTime.now();

        if ("1year".equals(period)) {
            startDate = now.minusYears(1);
        } else if ("1month".equals(period)) {
            startDate = now.minusMonths(1);
        } else { // default to 7 days
            startDate = now.minusDays(7);
        }

        List<Order> orders = orderRepository.findCompletedOrdersSince(startDate);

        // Use TreeMap to keep dates sorted chronologically
        Map<String, BigDecimal> chartData = new TreeMap<>();
        DateTimeFormatter formatter = "1year".equals(period)
                ? DateTimeFormatter.ofPattern("yyyy-MM")
                : DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (Order order : orders) {
            if (order.getCreatedAt() != null) {
                String key = order.getCreatedAt().format(formatter);
                BigDecimal total = chartData.getOrDefault(key, BigDecimal.ZERO);
                chartData.put(key,
                        total.add(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO));
            }
        }

        // Format to a List of objects for easier Frontend rendering
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : chartData.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("label", entry.getKey());
            point.put("revenue", entry.getValue());
            result.add(point);
        }

        return result;
    }
}
