package ecommerce.admin.service.impl;

import ecommerce.admin.dto.response.PaymentResponse;
import ecommerce.admin.entity.Order;
import ecommerce.admin.entity.Payment;
import ecommerce.admin.repository.OrderRepository;
import ecommerce.admin.repository.PaymentAdminRepository;
import ecommerce.admin.service.PaymentService;
import ecommerce.common.constant.PaymentStatus;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {
    @Autowired
    private PaymentAdminRepository repository;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> getList(String search, String status, String method, Long orderId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Payment> spec = Specification.where(null);

        if (search != null && !search.trim().isEmpty()) {
            String keyword = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("orderId").as(String.class)), keyword),
                cb.like(cb.lower(root.get("transactionId")), keyword)
            ));
        }
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("paymentStatus"), status.trim().toUpperCase()));
        }
        if (method != null && !method.trim().isEmpty() && !method.equalsIgnoreCase("ALL")) {
            String m = method.trim().toUpperCase();
            if (m.equals("QR") || m.equals("BANK_TRANSFER")) {
                spec = spec.and((root, query, cb) -> cb.or(
                    cb.equal(cb.upper(root.get("paymentMethod")), "QR"),
                    cb.equal(cb.upper(root.get("paymentMethod")), "BANK_TRANSFER")
                ));
            } else {
                spec = spec.and((root, query, cb) -> cb.equal(cb.upper(root.get("paymentMethod")), m));
            }
        }
        if (orderId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("orderId"), orderId));
        }

        Page<Payment> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public PaymentResponse updateStatus(Long id, String status) {
        PaymentStatus target = PaymentStatus.fromString(status);
        if (target == null) {
            throw new IllegalArgumentException("Trạng thái thanh toán không hợp lệ: " + status);
        }

        Payment entity = findById(id);
        PaymentStatus current = PaymentStatus.fromString(entity.getPaymentStatus());

        if (current == PaymentStatus.REFUNDED && target != PaymentStatus.REFUNDED) {
            throw new IllegalStateException("Giao dịch đã hoàn tiền, không thể đổi trạng thái");
        }
        if (target == PaymentStatus.REFUNDED && current != PaymentStatus.PAID) {
            throw new IllegalStateException("Chỉ có thể hoàn tiền cho giao dịch đã thanh toán");
        }

        entity.setPaymentStatus(target.name());
        if (target == PaymentStatus.PAID) {
            if (entity.getPaidAt() == null) {
                entity.setPaidAt(LocalDateTime.now());
            }
        } else if (target != PaymentStatus.REFUNDED) {
            entity.setPaidAt(null);
        }
        return mapToResponse(repository.save(entity));
    }

    private Payment findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id " + id));
    }

    private PaymentResponse mapToResponse(Payment p) {
        PaymentResponse response = PaymentResponse.builder()
                .id(p.getId())
                .orderId(p.getOrderId())
                .paymentMethod(p.getPaymentMethod())
                .amount(p.getAmount())
                .paymentStatus(p.getPaymentStatus())
                .transactionId(p.getTransactionId())
                .qrCodeUrl(p.getQrCodeUrl())
                .paymentResponse(p.getPaymentResponse())
                .expiredAt(p.getExpiredAt())
                .paidAt(p.getPaidAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();

        if (p.getOrderId() != null) {
            Order order = orderRepository.findById(p.getOrderId()).orElse(null);
            if (order != null) {
                response.setReceiverName(order.getReceiverName());
                response.setReceiverPhone(order.getReceiverPhone());
                response.setOrderTotalAmount(order.getTotalAmount());
                response.setOrderStatus(order.getStatus());
            }
        }
        return response;
    }
}
