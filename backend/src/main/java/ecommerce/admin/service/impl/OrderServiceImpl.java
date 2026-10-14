package ecommerce.admin.service.impl;

import ecommerce.admin.dto.response.OrderDetailItemResponse;
import ecommerce.admin.dto.response.OrderResponse;
import ecommerce.admin.dto.response.OrderStatusHistoryResponse;
import ecommerce.admin.entity.Order;
import ecommerce.admin.entity.OrderDetail;
import ecommerce.admin.entity.OrderStatusHistory;
import ecommerce.admin.entity.Payment;
import ecommerce.admin.entity.UserAddress;
import ecommerce.common.constant.OrderStatus;
import ecommerce.admin.repository.OrderDetailRepository;
import ecommerce.admin.repository.OrderRepository;
import ecommerce.admin.repository.OrderStatusHistoryRepository;
import ecommerce.admin.repository.PaymentRepository;
import ecommerce.admin.repository.UserAddressRepository;
import ecommerce.admin.service.OrderService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {
    @Autowired
    private OrderRepository repository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserAddressRepository userAddressRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Override
    public PageResponse<OrderResponse> getList(String search, String status, Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Order> spec = Specification.where(null);
        if (search != null && !search.trim().isEmpty()) {
            String keyword = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("id").as(String.class)), keyword),
                cb.like(cb.lower(root.get("receiverName")), keyword),
                cb.like(cb.lower(root.get("receiverPhone")), keyword)
            ));
        }
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (userId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("userId"), userId));
        }
        Page<Order> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToSummaryResponse));
    }

    @Override
    public OrderResponse getById(Long id) {
        Order entity = findById(id);
        OrderResponse response = mapToSummaryResponse(entity);

        // 1. Lấy danh sách sản phẩm trong đơn hàng
        List<OrderDetail> details = orderDetailRepository.findByOrderId(id);
        List<OrderDetailItemResponse> items = details.stream().map(d -> {
            BigDecimal qty = BigDecimal.valueOf(d.getQuantity() != null ? d.getQuantity() : 0);
            BigDecimal unitPrice = d.getUnitPrice() != null ? d.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal subtotal = unitPrice.multiply(qty);

            return OrderDetailItemResponse.builder()
                    .id(d.getId())
                    .productVariantId(d.getProductVariantId())
                    .productName(d.getProductName())
                    .productImageUrl(d.getProductImageUrl())
                    .variantSize(d.getVariantSize())
                    .variantColor(d.getVariantColor())
                    .quantity(d.getQuantity())
                    .unitPrice(d.getUnitPrice())
                    .subtotal(subtotal)
                    .build();
        }).collect(Collectors.toList());
        response.setItems(items);

        // 2. Lấy lịch sử thay đổi trạng thái đơn hàng (order_status_history)
        response.setStatusHistory(getHistory(id));

        return response;
    }

    @Override
    public List<OrderStatusHistoryResponse> getHistory(Long id) {
        Order entity = findById(id);
        List<OrderStatusHistory> historyList = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtDesc(id);
        List<OrderStatusHistoryResponse> historyResponses = new ArrayList<>();

        for (OrderStatusHistory h : historyList) {
            historyResponses.add(OrderStatusHistoryResponse.builder()
                    .id(h.getId())
                    .orderId(h.getOrderId())
                    .oldStatus(h.getOldStatus())
                    .newStatus(h.getNewStatus())
                    .changedBy(h.getChangedBy())
                    .changedByName(h.getChangedBy() != null ? "Quản trị viên" : "Hệ thống")
                    .note(h.getNote())
                    .createdAt(h.getCreatedAt())
                    .build());
        }

        // Nếu chưa có lịch sử, khởi tạo mốc đầu tiên từ ngày tạo đơn
        if (historyResponses.isEmpty() && entity.getCreatedAt() != null) {
            historyResponses.add(OrderStatusHistoryResponse.builder()
                    .orderId(id)
                    .oldStatus(null)
                    .newStatus("PENDING")
                    .changedByName("Khách hàng")
                    .note("Khách hàng đặt đơn hàng thành công")
                    .createdAt(entity.getCreatedAt())
                    .build());
        }

        return historyResponses;
    }

    @Override
    public void updateStatus(Long id, String status) {
        updateStatus(id, status, null);
    }

    @Override
    public void updateStatus(Long id, String status, String note) {
        Order entity = findById(id);
        String oldStatus = entity.getStatus();

        OrderStatus targetStatusEnum = OrderStatus.fromString(status);
        if (targetStatusEnum == null) {
            throw new IllegalArgumentException("Trạng thái đơn hàng không hợp lệ: " + status);
        }

        String targetStatus = targetStatusEnum.name();

        if (!targetStatus.equalsIgnoreCase(oldStatus)) {
            entity.setStatus(targetStatus);
            entity.setUpdatedAt(LocalDateTime.now());

            String actionNote;
            if (targetStatusEnum == OrderStatus.CANCELLED) {
                OrderStatus currentStatusEnum = OrderStatus.fromString(oldStatus);
                if (currentStatusEnum == null || !currentStatusEnum.canCancel()) {
                    throw new IllegalStateException("Không thể hủy đơn hàng khi đơn đang giao hoặc đã hoàn thành");
                }
                String defaultCancelNote = "Quản trị viên chuyển trạng thái Hủy đơn hàng";
                String reason = (note != null && !note.trim().isEmpty()) ? note.trim() : defaultCancelNote;
                entity.setCancelledAt(LocalDateTime.now());
                entity.setCancelReason(reason);
                actionNote = reason.equals(defaultCancelNote) ? defaultCancelNote : ("Quản trị viên hủy đơn hàng: " + reason);
            } else {
                actionNote = (note != null && !note.trim().isEmpty()) 
                    ? note.trim() 
                    : String.format("Quản trị viên chuyển trạng thái từ '%s' sang '%s'", oldStatus, targetStatus);
            }

            repository.save(entity);

            // Ghi lịch sử vào order_status_history
            OrderStatusHistory history = OrderStatusHistory.builder()
                    .orderId(id)
                    .oldStatus(oldStatus)
                    .newStatus(targetStatus)
                    .changedBy(1L)
                    .note(actionNote)
                    .createdAt(LocalDateTime.now())
                    .build();
            orderStatusHistoryRepository.save(history);
        }
    }

    @Override
    public void cancel(Long id) {
        cancel(id, "Quản trị viên chuyển trạng thái Hủy đơn hàng");
    }

    @Override
    public void cancel(Long id, String reason) {
        Order entity = findById(id);
        String oldStatus = entity.getStatus();

        if ("CANCELLED".equalsIgnoreCase(oldStatus)) {
            throw new IllegalStateException("Đơn hàng này đã bị hủy trước đó");
        }

        OrderStatus currentStatusEnum = OrderStatus.fromString(oldStatus);
        if (currentStatusEnum == null || !currentStatusEnum.canCancel()) {
            throw new IllegalStateException("Không thể hủy đơn hàng khi đơn đang giao hoặc đã hoàn thành");
        }

        String defaultCancelNote = "Quản trị viên chuyển trạng thái Hủy đơn hàng";
        String finalReason = (reason != null && !reason.trim().isEmpty()) ? reason.trim() : defaultCancelNote;
        entity.setStatus(OrderStatus.CANCELLED.name());
        entity.setCancelledAt(LocalDateTime.now());
        entity.setCancelReason(finalReason);
        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);

        String actionNote = finalReason.equals(defaultCancelNote) ? defaultCancelNote : ("Quản trị viên hủy đơn hàng: " + finalReason);

        // Ghi lịch sử hủy đơn vào order_status_history
        OrderStatusHistory history = OrderStatusHistory.builder()
                .orderId(id)
                .oldStatus(oldStatus)
                .newStatus(OrderStatus.CANCELLED.name())
                .changedBy(1L)
                .note(actionNote)
                .createdAt(LocalDateTime.now())
                .build();
        orderStatusHistoryRepository.save(history);
    }

    private Order findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + id));
    }

    private OrderResponse mapToSummaryResponse(Order entity) {
        LocalDateTime cancelledAt = entity.getCancelledAt();
        String cancelReason = entity.getCancelReason();
        if ("CANCELLED".equalsIgnoreCase(entity.getStatus())) {
            if (cancelledAt == null) {
                cancelledAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt();
            }
            if (cancelReason == null || cancelReason.trim().isEmpty()) {
                cancelReason = "Quản trị viên chuyển trạng thái Hủy đơn hàng";
            }
        }

        OrderResponse response = OrderResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .couponId(entity.getCouponId())
                .receiverName(entity.getReceiverName())
                .receiverPhone(entity.getReceiverPhone())
                .shippingAddress(entity.getShippingAddress())
                .orderNote(entity.getOrderNote())
                .subtotalAmount(entity.getSubtotalAmount())
                .shippingFee(entity.getShippingFee())
                .discountAmount(entity.getDiscountAmount())
                .totalAmount(entity.getTotalAmount())
                .status(entity.getStatus())
                .cancelledAt(cancelledAt)
                .cancelReason(cancelReason)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();

        // 1. Lấy địa chỉ mặc định của người dùng từ userId
        if (entity.getUserId() != null) {
            Optional<UserAddress> defaultAddrOpt = userAddressRepository.findByUserIdAndIsDefaultTrue(entity.getUserId());
            if (defaultAddrOpt.isEmpty()) {
                defaultAddrOpt = userAddressRepository.findFirstByUserIdOrderByIsDefaultDesc(entity.getUserId());
            }

            defaultAddrOpt.ifPresent(addr -> {
                String fullAddress = String.format("%s, %s, %s, %s",
                        addr.getStreetAddress() != null ? addr.getStreetAddress() : "",
                        addr.getWard() != null ? addr.getWard() : "",
                        addr.getDistrict() != null ? addr.getDistrict() : "",
                        addr.getProvince() != null ? addr.getProvince() : "").replaceAll("^(,\\s*)+|(,\\s*)+$", "");
                
                response.setCustomerDefaultAddress(fullAddress);

                // Nếu đơn hàng chưa có thông tin địa chỉ hoặc người nhận, dùng địa chỉ mặc định
                if (response.getShippingAddress() == null || response.getShippingAddress().trim().isEmpty()) {
                    response.setShippingAddress(fullAddress);
                }
                if (response.getReceiverName() == null || response.getReceiverName().trim().isEmpty()) {
                    response.setReceiverName(addr.getReceiverName());
                }
                if (response.getReceiverPhone() == null || response.getReceiverPhone().trim().isEmpty()) {
                    response.setReceiverPhone(addr.getReceiverPhone());
                }
            });
        }

        // 2. Gắn thông tin thanh toán nếu có
        Optional<Payment> paymentOpt = paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(entity.getId());
        if (paymentOpt.isPresent()) {
            Payment p = paymentOpt.get();
            response.setPaymentMethod(p.getPaymentMethod());
            response.setPaymentStatus(p.getPaymentStatus());
            response.setTransactionId(p.getTransactionId());
            response.setPaidAt(p.getPaidAt());
        } else {
            response.setPaymentMethod("COD");
            response.setPaymentStatus("PENDING");
        }

        return response;
    }
}
