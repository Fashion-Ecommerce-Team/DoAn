
package ecommerce.cart.service;

import ecommerce.cart.dto.AddCartItemRequest;
import ecommerce.cart.dto.CartItemResponse;
import ecommerce.cart.dto.UpdateCartItemRequest;
import ecommerce.cart.entity.CartItem;
import ecommerce.cart.repository.CartItemRepository;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final JdbcTemplate jdbcTemplate;

    public CartService(
            CartItemRepository cartItemRepository,
            JdbcTemplate jdbcTemplate) {
        this.cartItemRepository = cartItemRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CartItemResponse> getCart(Long userId) {
        return cartItemRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public long getCartCount(Long userId) {
        return cartItemRepository.countByUserId(userId);
    }

    public CartItemResponse addItem(
            Long userId,
            AddCartItemRequest request) {

        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new IllegalArgumentException(
                    "Số lượng phải lớn hơn hoặc bằng 1");
        }

        Map<String, Object> variant =
                getActiveVariant(request.getProductVariantId());

        int stock = ((Number) variant.get("stock_quantity")).intValue();

        CartItem cartItem = cartItemRepository
                .findByUserIdAndProductVariantId(
                        userId, request.getProductVariantId())
                .orElse(null);

        int currentQuantity =
                cartItem == null ? 0 : cartItem.getQuantity();

        long newQuantity =
                (long) currentQuantity + request.getQuantity();

        if (newQuantity > stock) {
            throw new IllegalArgumentException(
                    "Số lượng yêu cầu vượt quá tồn kho. Tồn kho hiện tại: "
                            + stock);
        }

        if (cartItem == null) {
            cartItem = new CartItem();
            cartItem.setUserId(userId);
            cartItem.setProductVariantId(request.getProductVariantId());
        }

        cartItem.setQuantity((int) newQuantity);

        return toResponse(cartItemRepository.save(cartItem));
    }

    public CartItemResponse updateItem(
            Long userId,
            Long itemId,
            UpdateCartItemRequest request) {

        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new IllegalArgumentException(
                    "Số lượng phải lớn hơn hoặc bằng 1");
        }

        CartItem cartItem = cartItemRepository.findById(itemId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy sản phẩm trong giỏ hàng"));

        if (!cartItem.getUserId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Bạn không có quyền sửa sản phẩm trong giỏ hàng này");
        }

        Map<String, Object> variant =
                getActiveVariant(cartItem.getProductVariantId());

        int stock = ((Number) variant.get("stock_quantity")).intValue();

        if (request.getQuantity() > stock) {
            throw new IllegalArgumentException(
                    "Số lượng yêu cầu vượt quá tồn kho. Tồn kho hiện tại: "
                            + stock);
        }

        cartItem.setQuantity(request.getQuantity());

        return toResponse(cartItemRepository.save(cartItem));
    }

    public void deleteItem(Long userId, Long productVariantId) {
        CartItem cartItem = cartItemRepository
                .findByUserIdAndProductVariantId(userId, productVariantId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy sản phẩm trong giỏ hàng"));

        cartItemRepository.delete(cartItem);
    }

    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    /**
     * Kiểm tra toàn bộ giỏ hàng trước khi thanh toán.
     * Trả về kết quả từng dòng hàng và trạng thái tổng thể.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> validateCart(Long userId) {
        List<CartItem> cartItems =
                cartItemRepository.findByUserId(userId);

        List<Map<String, Object>> results = new ArrayList<>();
        boolean valid = true;

        for (CartItem item : cartItems) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("cartItemId", item.getId());
            result.put("productVariantId", item.getProductVariantId());
            result.put("requestedQuantity", item.getQuantity());

            try {
                Map<String, Object> variant =
                        getActiveVariant(item.getProductVariantId());

                int stock =
                        ((Number) variant.get("stock_quantity")).intValue();

                result.put("stockQuantity", stock);

                boolean enoughStock = item.getQuantity() <= stock;
                result.put("valid", enoughStock);

                if (enoughStock) {
                    result.put("message", "Sản phẩm hợp lệ");
                } else {
                    result.put("message",
                            "Số lượng trong giỏ vượt quá tồn kho");
                    valid = false;
                }
            } catch (IllegalArgumentException ex) {
                result.put("stockQuantity", null);
                result.put("valid", false);
                result.put("message", ex.getMessage());
                valid = false;
            }

            results.add(result);
        }

        if (cartItems.isEmpty()) {
            valid = false;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("valid", valid);
        response.put("itemCount", cartItems.size());
        response.put("items", results);

        if (cartItems.isEmpty()) {
            response.put("message", "Giỏ hàng đang trống");
        } else if (valid) {
            response.put("message",
                    "Tất cả sản phẩm trong giỏ hàng đều hợp lệ");
        } else {
            response.put("message",
                    "Giỏ hàng có sản phẩm cần kiểm tra trước khi thanh toán");
        }

        return response;
    }

    /**
     * Trả về thông tin biến thể nếu biến thể và sản phẩm đang hoạt động.
     */
    private Map<String, Object> getActiveVariant(Long productVariantId) {
        if (productVariantId == null) {
            throw new IllegalArgumentException(
                    "productVariantId không được để trống");
        }

        String sql = """
                SELECT
                    v.id AS variant_id,
                    v.stock_quantity AS stock_quantity,
                    v.status AS variant_status,
                    p.status AS product_status,
                    p.deleted_at AS deleted_at
                FROM product_variants v
                INNER JOIN products p ON p.id = v.product_id
                WHERE v.id = ?
                """;

        List<Map<String, Object>> rows;

        try {
            rows = jdbcTemplate.queryForList(sql, productVariantId);
        } catch (DataAccessException ex) {
            throw new IllegalArgumentException(
                    "Không thể kiểm tra thông tin sản phẩm trong cơ sở dữ liệu");
        }

        if (rows.isEmpty()) {
            throw new IllegalArgumentException(
                    "Biến thể sản phẩm không tồn tại");
        }

        Map<String, Object> variant = rows.get(0);

        if (!"ACTIVE".equalsIgnoreCase(
                String.valueOf(variant.get("variant_status")))) {
            throw new IllegalArgumentException(
                    "Biến thể sản phẩm hiện không hoạt động");
        }

        if (!"ACTIVE".equalsIgnoreCase(
                String.valueOf(variant.get("product_status")))) {
            throw new IllegalArgumentException(
                    "Sản phẩm hiện không hoạt động");
        }

        if (variant.get("deleted_at") != null) {
            throw new IllegalArgumentException(
                    "Sản phẩm đã bị xóa");
        }

        return variant;
    }

    private CartItemResponse toResponse(CartItem cartItem) {
        return new CartItemResponse(
                cartItem.getId(),
                cartItem.getProductVariantId(),
                cartItem.getQuantity(),
                cartItem.getCreatedAt(),
                cartItem.getUpdatedAt());
    }
}
