package ecommerce.admin.service.impl;

import ecommerce.admin.entity.Order;
import ecommerce.admin.entity.User;
import ecommerce.admin.repository.OrderRepository;
import ecommerce.admin.repository.ProductRepository;
import ecommerce.admin.repository.UserRepository;
import ecommerce.admin.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

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

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : chartData.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("label", entry.getKey());
            point.put("revenue", entry.getValue());
            result.add(point);
        }

        return result;
    }

    @Override
    public Object getUserGrowthChart() {
        LocalDate now = LocalDate.now();
        LocalDate startMonth = now.minusMonths(11).withDayOfMonth(1);
        LocalDateTime startDateTime = startMonth.atStartOfDay();

        Map<String, Long> userCountMap = new LinkedHashMap<>();
        Map<String, String> monthLabels = new HashMap<>();
        DateTimeFormatter keyFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (int i = 0; i < 12; i++) {
            LocalDate m = startMonth.plusMonths(i);
            String key = m.format(keyFormatter);
            String display = "T" + m.getMonthValue() + "/" + (m.getYear() % 100);
            userCountMap.put(key, 0L);
            monthLabels.put(key, display);
        }

        List<User> users = userRepository.findUsersSince(startDateTime);
        for (User u : users) {
            if (u.getCreatedAt() != null) {
                String key = u.getCreatedAt().format(keyFormatter);
                if (userCountMap.containsKey(key)) {
                    userCountMap.put(key, userCountMap.get(key) + 1L);
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : userCountMap.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("period", entry.getKey());
            point.put("label", monthLabels.get(entry.getKey()));
            point.put("users", entry.getValue());
            result.add(point);
        }

        return result;
    }

    @Override
    public Object getOrderGrowthChart() {
        LocalDate now = LocalDate.now();
        LocalDate startMonth = now.minusMonths(11).withDayOfMonth(1);
        LocalDateTime startDateTime = startMonth.atStartOfDay();

        Map<String, Long> orderCountMap = new LinkedHashMap<>();
        Map<String, BigDecimal> orderAmountMap = new LinkedHashMap<>();
        Map<String, String> monthLabels = new HashMap<>();
        DateTimeFormatter keyFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (int i = 0; i < 12; i++) {
            LocalDate m = startMonth.plusMonths(i);
            String key = m.format(keyFormatter);
            String display = "T" + m.getMonthValue() + "/" + (m.getYear() % 100);
            orderCountMap.put(key, 0L);
            orderAmountMap.put(key, BigDecimal.ZERO);
            monthLabels.put(key, display);
        }

        List<Order> orders = orderRepository.findOrdersSince(startDateTime);
        for (Order o : orders) {
            if (o.getCreatedAt() != null) {
                String key = o.getCreatedAt().format(keyFormatter);
                if (orderCountMap.containsKey(key)) {
                    orderCountMap.put(key, orderCountMap.get(key) + 1L);
                    if (o.getTotalAmount() != null) {
                        orderAmountMap.put(key, orderAmountMap.get(key).add(o.getTotalAmount()));
                    }
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : orderCountMap.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("period", entry.getKey());
            point.put("label", monthLabels.get(entry.getKey()));
            point.put("orders", entry.getValue());
            point.put("revenue", orderAmountMap.get(entry.getKey()));
            result.add(point);
        }

        return result;
    }

    @Override
    public Object getBrandRevenue() {
        return orderRepository.getRevenueByBrand();
    }

    @Override
    public Object getCategoryRevenue() {
        return orderRepository.getRevenueByCategory();
    }

    @Override
    public Object getTopCoupons() {
        return orderRepository.getTopCoupons();
    }

    @Override
    public Object getCustomerRetention() {
        List<Map<String, Object>> customerStats = orderRepository.getCustomerOrderStats();
        long totalCustomers = customerStats.size();
        long repeatCustomers = 0;
        long oneTimeCustomers = 0;
        long totalOrdersAll = 0;

        for (Map<String, Object> c : customerStats) {
            Number cnt = (Number) c.get("orderCount");
            long orderCount = cnt != null ? cnt.longValue() : 0;
            totalOrdersAll += orderCount;
            if (orderCount >= 2) {
                repeatCustomers++;
            } else {
                oneTimeCustomers++;
            }
        }

        double retentionRate = totalCustomers > 0
                ? Math.round(((double) repeatCustomers / totalCustomers * 100.0) * 10.0) / 10.0
                : 0.0;
        double avgOrdersPerCustomer = totalCustomers > 0
                ? Math.round(((double) totalOrdersAll / totalCustomers) * 10.0) / 10.0
                : 0.0;

        Map<String, Object> result = new HashMap<>();
        result.put("totalCustomers", totalCustomers);
        result.put("repeatCustomers", repeatCustomers);
        result.put("oneTimeCustomers", oneTimeCustomers);
        result.put("retentionRate", retentionRate);
        result.put("avgOrdersPerCustomer", avgOrdersPerCustomer);
        result.put("topCustomers", customerStats.stream().limit(5).toList());
        return result;
    }

    @Override
    public Object getPaymentMethodRevenue() {
        return orderRepository.getPaymentMethodStats();
    }

    @Override
    public Object getCancellationStats() {
        List<Map<String, Object>> overviewList = orderRepository.getCancellationOverview();
        Map<String, Object> overview = overviewList.isEmpty() ? new HashMap<>() : overviewList.get(0);

        Number total = (Number) overview.get("totalOrders");
        Number cancelled = (Number) overview.get("cancelledOrders");
        long totalOrders = total != null ? total.longValue() : 0;
        long cancelledOrders = cancelled != null ? cancelled.longValue() : 0;

        double cancellationRate = totalOrders > 0
                ? Math.round(((double) cancelledOrders / totalOrders * 100.0) * 10.0) / 10.0
                : 0.0;

        Map<String, Object> result = new HashMap<>(overview);
        result.put("cancellationRate", cancellationRate);
        result.put("reasons", orderRepository.getCancellationReasons());
        return result;
    }
}
