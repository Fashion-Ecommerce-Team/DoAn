package ecommerce.admin.service;

import ecommerce.admin.dto.response.PaymentResponse;
import ecommerce.common.response.PageResponse;

public interface PaymentService {
    PageResponse<PaymentResponse> getList(String search, String status, String method, Long orderId, int page, int size);

    PaymentResponse getById(Long id);

    PaymentResponse updateStatus(Long id, String status);
}
