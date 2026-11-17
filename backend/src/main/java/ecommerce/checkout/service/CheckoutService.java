
package ecommerce.checkout.service;

import ecommerce.cart.entity.CartItem;
import ecommerce.cart.repository.CartItemRepository;
import ecommerce.cart.service.CartService;

import ecommerce.checkout.dto.CheckoutPreviewResponse;
import ecommerce.checkout.dto.CheckoutValidateRequest;
import ecommerce.checkout.dto.CreateAddressRequest;

import ecommerce.coupon.dto.CouponValidateResponse;
import ecommerce.coupon.service.CouponService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CheckoutService {

    private final CartItemRepository cartItemRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CartService cartService;
    private final CouponService couponService;
    private final BigDecimal shippingFee;

    public CheckoutService(
            CartItemRepository cartItemRepository,
            JdbcTemplate jdbcTemplate,
            CartService cartService,
            CouponService couponService,
            @Value("${checkout.shipping-fee:30000}")
            BigDecimal shippingFee
    ) {
        this.cartItemRepository = cartItemRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.cartService = cartService;
        this.couponService = couponService;
        this.shippingFee = shippingFee;
    }

    /**
     * Xem trước đơn hàng.
     * Không tạo đơn hàng và không trừ tồn kho.
     * Giá sản phẩm không sử dụng discount_price.
     */
    @Transactional(readOnly = true)
    public CheckoutPreviewResponse preview(Long userId) {

        List<CartItem> cartItems =
                cartItemRepository.findByUserId(userId);

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException(
                    "Giỏ hàng đang trống"
            );
        }

        List<CheckoutPreviewResponse.Item> items =
                new ArrayList<>();

        BigDecimal subtotal = BigDecimal.ZERO;

        // Website chỉ giảm giá bằng coupon.
        // Giữ trường này bằng 0 để tương thích DTO hiện tại.
        BigDecimal productDiscount = BigDecimal.ZERO;

        int itemCount = 0;

        for (CartItem cartItem : cartItems) {

            String sql = """
                    SELECT
                        p.name AS product_name,
                        p.base_price AS base_price,
                        p.status AS product_status,
                        p.deleted_at AS deleted_at,

                        v.size AS size,
                        v.color AS color,
                        v.price_adjustment AS price_adjustment,
                        v.stock_quantity AS stock_quantity,
                        v.status AS variant_status,

                        (
                            SELECT pi.image_url
                            FROM product_images pi
                            WHERE pi.product_id = p.id
                              AND pi.is_primary = 1
                            LIMIT 1
                        ) AS image_url

                    FROM product_variants v
                    INNER JOIN products p
                        ON p.id = v.product_id

                    WHERE v.id = ?
                    """;

            List<Map<String, Object>> rows =
                    jdbcTemplate.queryForList(
                            sql,
                            cartItem.getProductVariantId()
                    );

            if (rows.isEmpty()) {
                throw new IllegalArgumentException(
                        "Không tìm thấy biến thể sản phẩm ID: "
                                + cartItem.getProductVariantId()
                );
            }

            Map<String, Object> row = rows.get(0);

            // 1. Kiểm tra trạng thái sản phẩm.
            boolean productActive =
                    "ACTIVE".equalsIgnoreCase(
                            String.valueOf(
                                    row.get("product_status")
                            )
                    );

            boolean variantActive =
                    "ACTIVE".equalsIgnoreCase(
                            String.valueOf(
                                    row.get("variant_status")
                            )
                    );

            boolean productDeleted =
                    row.get("deleted_at") != null;

            if (!productActive
                    || !variantActive
                    || productDeleted) {

                throw new IllegalArgumentException(
                        "Sản phẩm hoặc biến thể đã ngừng hoạt động"
                );
            }

            // 2. Kiểm tra tồn kho.
            int stock = ((Number)
                    row.get("stock_quantity")).intValue();

            if (cartItem.getQuantity() > stock) {
                throw new IllegalArgumentException(
                        "Sản phẩm ID "
                                + cartItem.getProductVariantId()
                                + " không đủ tồn kho"
                );
            }

            if (cartItem.getQuantity() <= 0) {
                throw new IllegalArgumentException(
                        "Số lượng sản phẩm không hợp lệ"
                );
            }

            // 3. Tính giá sản phẩm.
            BigDecimal basePrice =
                    toBigDecimal(row.get("base_price"));

            BigDecimal priceAdjustment =
                    toBigDecimal(
                            row.get("price_adjustment")
                    );

            BigDecimal unitPrice =
                    basePrice.add(priceAdjustment);

            if (unitPrice.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Giá sản phẩm không hợp lệ"
                );
            }

            // 4. Tính thành tiền từng sản phẩm.
            BigDecimal quantity =
                    BigDecimal.valueOf(
                            cartItem.getQuantity()
                    );

            BigDecimal lineTotal =
                    unitPrice.multiply(quantity);

            subtotal = subtotal.add(lineTotal);

            itemCount += cartItem.getQuantity();

            // 5. Thêm sản phẩm vào response.
            items.add(
                    new CheckoutPreviewResponse.Item(
                            cartItem.getId(),
                            cartItem.getProductVariantId(),
                            (String) row.get("product_name"),
                            (String) row.get("size"),
                            (String) row.get("color"),
                            (String) row.get("image_url"),
                            cartItem.getQuantity(),
                            unitPrice,
                            lineTotal
                    )
            );
        }

        // Chưa áp dụng coupon trong preview.
        BigDecimal totalAmount =
                subtotal.add(shippingFee);

        return new CheckoutPreviewResponse(
                items,
                itemCount,
                subtotal,
                productDiscount,
                shippingFee,
                totalAmount
        );
    }

    /**
     * Kiểm tra Checkout:
     * - Địa chỉ giao hàng
     * - Giỏ hàng
     * - Tồn kho
     * - Coupon
     * - Tổng tiền
     *
     * Không tạo đơn hàng và không trừ tồn kho.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> validate(
            Long userId,
            CheckoutValidateRequest request
    ) {

        Map<String, Object> result =
                new LinkedHashMap<>();

        List<String> errors =
                new ArrayList<>();

        // ========================================
        // 1. KIỂM TRA ĐỊA CHỈ GIAO HÀNG
        // ========================================

        List<Map<String, Object>> addresses =
                jdbcTemplate.queryForList(
                        """
                        SELECT
                            id,
                            receiver_name,
                            receiver_phone,
                            province,
                            district,
                            ward,
                            street_address
                        FROM user_addresses
                        WHERE id = ?
                          AND user_id = ?
                        """,
                        request.getAddressId(),
                        userId
                );

        boolean addressValid =
                !addresses.isEmpty();

        result.put("addressValid", addressValid);

        if (addressValid) {
            result.put(
                    "address",
                    addresses.get(0)
            );
        } else {
            errors.add(
                    "Địa chỉ giao hàng không tồn tại "
                            + "hoặc không thuộc về bạn"
            );
        }

        // ========================================
        // 2. KIỂM TRA GIỎ HÀNG VÀ TỒN KHO
        // ========================================

        Map<String, Object> cartResult =
                cartService.validateCart(userId);

        boolean cartValid =
                Boolean.TRUE.equals(
                        cartResult.get("valid")
                );

        result.put("cartValid", cartValid);
        result.put("cart", cartResult);

        if (!cartValid) {
            errors.add(
                    String.valueOf(
                            cartResult.get("message")
                    )
            );
        }

        // ========================================
        // 3. TÍNH TỔNG TIỀN
        // ========================================

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;

        // Chỉ tính preview khi giỏ hàng hợp lệ.
        if (cartValid) {
            try {
                CheckoutPreviewResponse previewResult =
                        preview(userId);

               subtotal = previewResult.getSubtotal();
            } catch (IllegalArgumentException ex) {
                cartValid = false;

                result.put("cartValid", false);

                errors.add(ex.getMessage());
            }
        }

        BigDecimal totalAmount =
                subtotal.add(shippingFee);

        // ========================================
        // 4. KIỂM TRA COUPON
        // ========================================

        String couponCode =
                request.getCouponCode();

        if (couponCode != null
                && !couponCode.isBlank()) {

            if (!cartValid) {

                result.put("couponValid", false);
                result.put(
                        "couponMessage",
                        "Giỏ hàng không hợp lệ, "
                                + "không thể áp dụng coupon"
                );

            } else {

                try {
                    CouponValidateResponse couponResult =
                            couponService.validate(
                                    userId,
                                    couponCode
                            );

                    // Đảm bảo giá trị giỏ hàng được
                    // tính nhất quán giữa hai service.
                    if (couponResult.subtotal()
                            .compareTo(subtotal) != 0) {

                        throw new IllegalArgumentException(
                                "Giá trị giỏ hàng đã thay đổi, "
                                        + "vui lòng thử lại"
                        );
                    }

                    // CouponService hiện dùng phí
                    // vận chuyển mặc định 30000.
                    // Checkout dùng phí cấu hình.
                    // Lấy phí của Checkout làm chuẩn.
                    discountAmount =
                            couponResult.discountAmount();

                    totalAmount = subtotal
                            .subtract(discountAmount)
                            .add(shippingFee);

                    result.put("couponValid", true);

                    result.put(
                            "couponCode",
                            couponResult.couponCode()
                    );

                    result.put(
                            "couponMessage",
                            couponResult.message()
                    );

                } catch (IllegalArgumentException ex) {

                    result.put("couponValid", false);

                    result.put(
                            "couponMessage",
                            ex.getMessage()
                    );

                    errors.add(ex.getMessage());
                }
            }

        } else {

            result.put("couponValid", true);

            result.put(
                    "couponMessage",
                    "Không sử dụng mã giảm giá"
            );
        }

        // ========================================
        // 5. TRẢ VỀ THÔNG TIN TÍNH TIỀN
        // ========================================

        result.put("subtotal", subtotal);
        result.put("discountAmount", discountAmount);
        result.put("shippingFee", shippingFee);
        result.put("totalAmount", totalAmount);

        // ========================================
        // 6. KẾT QUẢ KIỂM TRA CHECKOUT
        // ========================================

        boolean valid = errors.isEmpty();

        result.put("valid", valid);
        result.put("errors", errors);

        result.put(
                "message",
                valid
                        ? "Thông tin checkout hợp lệ"
                        : "Checkout chưa hợp lệ, "
                                + "vui lòng kiểm tra lại"
        );

        return result;
    }

    /**
     * Lấy danh sách địa chỉ giao hàng
     * của người dùng đang đăng nhập.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAddresses(
            Long userId
    ) {

        String sql = """
                SELECT
                    id,
                    receiver_name,
                    receiver_phone,
                    province,
                    district,
                    ward,
                    street_address,
                    is_default
                FROM user_addresses
                WHERE user_id = ?
                ORDER BY is_default DESC, id DESC
                """;

        return jdbcTemplate.queryForList(
                sql,
                userId
        );
    }

    /**
     * Thêm địa chỉ giao hàng mới.
     */
    @Transactional
    public Map<String, Object> createAddress(
            Long userId,
            CreateAddressRequest request
    ) {

        String sql = """
                INSERT INTO user_addresses (
                    user_id,
                    receiver_name,
                    receiver_phone,
                    province,
                    district,
                    ward,
                    street_address
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        KeyHolder keyHolder =
                new GeneratedKeyHolder();

        jdbcTemplate.update(
                connection -> {

                    PreparedStatement ps =
                            connection.prepareStatement(
                                    sql,
                                    Statement.RETURN_GENERATED_KEYS
                            );

                    ps.setLong(
                            1,
                            userId
                    );

                    ps.setString(
                            2,
                            request.getReceiverName().trim()
                    );

                    ps.setString(
                            3,
                            request.getReceiverPhone().trim()
                    );

                    ps.setString(
                            4,
                            request.getProvince().trim()
                    );

                    ps.setString(
                            5,
                            request.getDistrict().trim()
                    );

                    ps.setString(
                            6,
                            request.getWard().trim()
                    );

                    ps.setString(
                            7,
                            request.getStreetAddress().trim()
                    );

                    return ps;
                },
                keyHolder
        );

        Number generatedId =
                keyHolder.getKey();

        if (generatedId == null) {
            throw new IllegalStateException(
                    "Không thể lấy ID địa chỉ vừa tạo"
            );
        }

        Long addressId =
                generatedId.longValue();

        return jdbcTemplate.queryForMap(
                """
                SELECT
                    id,
                    user_id,
                    receiver_name,
                    receiver_phone,
                    province,
                    district,
                    ward,
                    street_address,
                    is_default,
                    created_at
                FROM user_addresses
                WHERE id = ?
                  AND user_id = ?
                """,
                addressId,
                userId
        );
    }

    /**
     * Chuyển dữ liệu SQL thành BigDecimal.
     */
    private BigDecimal toBigDecimal(Object value) {

        if (value == null) {
            return BigDecimal.ZERO;
        }

        if (value instanceof BigDecimal decimal) {
            return decimal;
        }

        return new BigDecimal(
                value.toString()
        );
    }
}
