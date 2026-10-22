-- ============================================================
-- DATABASE SCHEMA — E-COMMERCE FASHION (Hoàn thiện)
-- Tạo lại: DROP DATABASE cũ → CREATE mới
-- ============================================================

DROP DATABASE IF EXISTS ecommerce_fashion_db;
CREATE DATABASE ecommerce_fashion_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_fashion_db;

-- ==========================================
-- 1. HỆ THỐNG PHÂN QUYỀN & NGƯỜI DÙNG
-- ==========================================
-- BẢNG 1: roles (Quyền hạn của người dùng)
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, 
    description VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- BẢNG 2: users (Thông tin tài khoản người dùng, hỗ trợ Login Google/Facebook)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL, -- Cho phép NULL để dùng Google Login
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    auth_provider VARCHAR(50) DEFAULT 'LOCAL', -- 'LOCAL', 'GOOGLE', 'FACEBOOK'
    provider_id VARCHAR(255) UNIQUE, -- ID trả về từ Google/Facebook
    role_id BIGINT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- BẢNG 3: user_addresses (Sổ địa chỉ giao hàng của người dùng)
CREATE TABLE IF NOT EXISTS user_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    receiver_name VARCHAR(255) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    province VARCHAR(100) NOT NULL, -- Tỉnh/Thành phố
    district VARCHAR(100) NOT NULL, -- Quận/Huyện
    ward VARCHAR(100) NOT NULL,     -- Phường/Xã
    street_address VARCHAR(255) NOT NULL, -- Số nhà, tên đường
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. DANH MỤC, THƯƠNG HIỆU & SẢN PHẨM
-- ==========================================
-- BẢNG 4: categories (Danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE, -- Dùng cho URL SEO (vd: /danh-muc/giay-sneaker)
    description TEXT,
    icon VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- BẢNG 5: brands (Thương hiệu sản phẩm)
CREATE TABLE IF NOT EXISTS brands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE, 
    logo_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- BẢNG 6: products (Thông tin chung của sản phẩm)
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT,
    brand_id BIGINT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE, -- SEO URL
    description TEXT,
    base_price DECIMAL(15, 2) NOT NULL, 
    discount_price DECIMAL(15, 2), -- Giá sau khi giảm (khuyến mãi)
    gender VARCHAR(20) DEFAULT 'UNISEX', -- 'MEN', 'WOMEN', 'KIDS', 'UNISEX'
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);
-- BẢNG 7: product_variants (Biến thể của sản phẩm: size, màu, tồn kho)
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    size VARCHAR(20) NOT NULL, 
    color VARCHAR(50) NOT NULL, 
    sku VARCHAR(100) UNIQUE NOT NULL, 
    stock_quantity INT NOT NULL DEFAULT 0, 
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
-- BẢNG 8: product_images (Hình ảnh sản phẩm & Vector AI phục vụ tìm kiếm)
CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    feature_vector TEXT, -- Vector AI sinh ra để tìm kiếm bằng hình ảnh (dự phòng, chính dùng Qdrant)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. TƯƠNG TÁC NGƯỜI DÙNG (GIỎ HÀNG, WISHLIST, REVIEW)
-- ==========================================
-- BẢNG 9: wishlists (Sản phẩm yêu thích)
CREATE TABLE IF NOT EXISTS wishlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
-- BẢNG 10: cart_items (Giỏ hàng của người dùng)
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_variant_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_variant_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);
-- BẢNG 11: reviews (Đánh giá sản phẩm & Cảm xúc từ AI)
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    sentiment_label VARCHAR(50), -- POSITIVE, NEGATIVE, NEUTRAL
    status VARCHAR(50) DEFAULT 'PUBLISHED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
-- BẢNG 12: notifications (Thông báo người dùng & hệ thống)
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- 'SYSTEM', 'ORDER', 'PROMOTION', 'ACCOUNT'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. KHUYẾN MÃI, ĐƠN HÀNG & THANH TOÁN
-- ==========================================
-- BẢNG 12: coupons (Mã giảm giá/Khuyến mãi)
CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type VARCHAR(50) NOT NULL, -- 'PERCENTAGE' (%), 'FIXED' (Trừ tiền trực tiếp)
    discount_value DECIMAL(15, 2) NOT NULL,
    min_order_value DECIMAL(15, 2) DEFAULT 0,
    max_discount_amount DECIMAL(15, 2), -- Tối đa giảm bao nhiêu tiền (nếu dùng %)
    usage_limit INT, -- Số lượt dùng tối đa
    used_count INT DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- BẢNG 13: orders (Thông tin Đơn hàng)
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_id BIGINT NULL,
    
    -- Lưu cứng thông tin giao hàng tại thời điểm đặt
    receiver_name VARCHAR(255) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL, 
    order_note TEXT,
    
    -- Tổng toán
    subtotal_amount DECIMAL(15, 2) NOT NULL, -- Tiền hàng
    shipping_fee DECIMAL(15, 2) DEFAULT 0,   -- Phí ship
    discount_amount DECIMAL(15, 2) DEFAULT 0, -- Tiền giảm giá
    total_amount DECIMAL(15, 2) NOT NULL,    -- Tổng tiền cuối cùng phải trả
    
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
);
-- BẢNG 14: order_details (Chi tiết từng sản phẩm trong đơn hàng)
CREATE TABLE IF NOT EXISTS order_details (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_variant_id BIGINT NOT NULL, 
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL, -- Chốt giá tại thời điểm mua
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);
-- BẢNG 15: payments (Lịch sử & trạng thái thanh toán)
CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'COD', 'VNPAY', 'MOMO'
    amount DECIMAL(15, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
    transaction_id VARCHAR(255), -- Mã giao dịch từ cổng thanh toán
    payment_response JSON, -- Log data trả về từ VNPAY/MOMO để đối soát
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);

-- ==========================================
-- 5. QUẢN LÝ BANNER & NỘI DUNG TRANG CHỦ
-- ==========================================
-- BẢNG 16: banners (Quản lý banner & Khuyến mãi trang chủ)
CREATE TABLE IF NOT EXISTS banners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(255),
    position VARCHAR(50) DEFAULT 'HERO_BANNER', -- 'HERO_BANNER', 'PROMO_BANNER', 'FEATURED_CATEGORY'
    display_order INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. [MỚI] THEO DÕI LỊCH SỬ TRẠNG THÁI ĐƠN HÀNG
-- ==========================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by BIGINT, -- user_id của người thay đổi (admin hoặc system)
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- 7. [MỚI] AI & CHATBOT — Đồng bộ Embedding, Chat, Policy
-- ==========================================

-- BẢNG: embedding_sync_log (Tracking đồng bộ MySQL ↔ Qdrant)
CREATE TABLE IF NOT EXISTS embedding_sync_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_id BIGINT, -- nullable: có thể embed text mô tả mà không cần ảnh
    qdrant_point_id VARCHAR(255), -- UUID point ID trong Qdrant
    model_version VARCHAR(100) DEFAULT 'fashion-clip-v1',
    embedding_type VARCHAR(20) DEFAULT 'IMAGE', -- 'IMAGE', 'TEXT', 'COMBINED'
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'DONE', 'FAILED'
    error_message TEXT,
    synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES product_images(id) ON DELETE SET NULL,
    INDEX idx_embed_status (status),
    INDEX idx_embed_product (product_id)
);

-- BẢNG: policy_documents (Tài liệu chính sách cho RAG Chatbot)
CREATE TABLE IF NOT EXISTS policy_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'SHIPPING', 'RETURN', 'WARRANTY', 'FAQ', 'SIZE_GUIDE'
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- BẢNG: policy_chunks (Chunks sau khi split document, đã embed vào Qdrant)
CREATE TABLE IF NOT EXISTS policy_chunks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INT NOT NULL, -- Thứ tự chunk trong document
    qdrant_point_id VARCHAR(255), -- UUID point ID trong Qdrant
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES policy_documents(id) ON DELETE CASCADE,
    INDEX idx_chunk_doc (document_id)
);

-- BẢNG: chat_sessions (Phiên chat của chatbot)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT, -- nullable cho khách chưa đăng nhập
    session_token VARCHAR(255) NOT NULL UNIQUE, -- UUID để identify session
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ENDED'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_session_user (user_id)
);

-- BẢNG: chat_messages (Tin nhắn trong phiên chat)
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'USER', 'ASSISTANT', 'SYSTEM'
    content TEXT NOT NULL,
    tool_calls_json JSON, -- Lưu thông tin tool calls của LLM (nếu có)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_msg_session (session_id)
);

-- ==========================================
-- 8. [MỚI] ANALYTICS & LOGS
-- ==========================================

-- BẢNG: search_logs (Log tìm kiếm để phân tích)
CREATE TABLE IF NOT EXISTS search_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT, -- nullable cho khách chưa đăng nhập
    query_text TEXT,
    query_image_url VARCHAR(500),
    search_type VARCHAR(20) NOT NULL, -- 'TEXT', 'IMAGE', 'HYBRID'
    result_count INT DEFAULT 0,
    clicked_product_id BIGINT, -- Sản phẩm user click sau khi search (nullable)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (clicked_product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_search_type (search_type),
    INDEX idx_search_date (created_at)
);

-- BẢNG: inventory_logs (Audit log tồn kho)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    variant_id BIGINT NOT NULL,
    change_quantity INT NOT NULL, -- Số lượng thay đổi (+ nhập, - bán/hủy)
    reason VARCHAR(50) NOT NULL, -- 'SALE', 'RETURN', 'RESTOCK', 'ADJUSTMENT', 'CANCEL'
    reference_id BIGINT, -- order_id hoặc id liên quan
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    INDEX idx_inv_variant (variant_id)
);

-- BẢNG: banners (Banner quảng cáo / Trang chủ)
CREATE TABLE IF NOT EXISTS banners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(255),
    position VARCHAR(50) DEFAULT 'HERO_BANNER',
    display_order INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cloudinary_public_id VARCHAR(255)
);