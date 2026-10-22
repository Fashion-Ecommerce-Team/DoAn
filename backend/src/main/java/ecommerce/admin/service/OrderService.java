package ecommerce.admin.service;

import ecommerce.admin.dto.response.OrderResponse;
import ecommerce.admin.dto.response.OrderStatusHistoryResponse;
import ecommerce.common.response.PageResponse;

import java.util.List;

import org.springframework.data.domain.Pageable;

public interface OrderService {
    PageResponse<OrderResponse> getList(String search, String status, Long userId, int page, int size);
    OrderResponse getById(Long id);
    List<OrderStatusHistoryResponse> getHistory(Long id);
    void updateStatus(Long id, String status);
    void updateStatus(Long id, String status, String note);
    void cancel(Long id);
    void cancel(Long id, String reason);
}
