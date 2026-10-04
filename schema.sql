
-- 1. TẠO VÀ CHỌN DATABASE
CREATE DATABASE IF NOT EXISTS `datn_db`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `datn_db`;
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `inventory_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `wishlists`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `product_variants`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `brands`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `user_addresses`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Bảng ROLES (Vai trò)
CREATE TABLE `roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng USERS (Người dùng)
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `auth_provider` VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
    `provider_id` VARCHAR(255) NULL,
    `role_id` BIGINT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    UNIQUE KEY `uk_users_provider_id` (`provider_id`),
    KEY `idx_users_role_id` (`role_id`),
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng USER_ADDRESSES (Sổ địa chỉ người dùng)
CREATE TABLE `user_addresses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `receiver_name` VARCHAR(255) NOT NULL,
    `receiver_phone` VARCHAR(20) NOT NULL,
    `address_line` VARCHAR(500) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `ward` VARCHAR(100) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_addresses_user_id` (`user_id`),
    CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng CATEGORIES (Danh mục sản phẩm)
CREATE TABLE `categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `image_url` VARCHAR(500) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng BRANDS (Thương hiệu sản phẩm)
CREATE TABLE `brands` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `logo_url` VARCHAR(500) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_brands_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng PRODUCTS (Sản phẩm)
CREATE TABLE `products` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT NULL,
    `brand_id` BIGINT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `base_price` DECIMAL(15,2) NOT NULL,
    `discount_price` DECIMAL(15,2) NULL,
    `gender` VARCHAR(50) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_products_slug` (`slug`),
    KEY `idx_products_category_id` (`category_id`),
    KEY `idx_products_brand_id` (`brand_id`),
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng PRODUCT_VARIANTS (Biến thể sản phẩm: Size, Color, Stock, SKU)
CREATE TABLE `product_variants` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `size` VARCHAR(50) NULL,
    `color` VARCHAR(100) NULL,
    `price` DECIMAL(15,2) NULL,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_product_variants_sku` (`sku`),
    KEY `idx_product_variants_product_id` (`product_id`),
    CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng PRODUCT_IMAGES (Hình ảnh sản phẩm)
CREATE TABLE `product_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `display_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_product_images_product_id` (`product_id`),
    CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng WISHLISTS (Danh sách yêu thích)
CREATE TABLE `wishlists` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_wishlists_user_product` (`user_id`, `product_id`),
    KEY `idx_wishlists_user_id` (`user_id`),
    KEY `idx_wishlists_product_id` (`product_id`),
    CONSTRAINT `fk_wishlists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_wishlists_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng REVIEWS (Đánh giá sản phẩm)
CREATE TABLE `reviews` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `product_id` BIGINT NOT NULL,
    `order_detail_id` BIGINT NULL,
    `rating` INT NOT NULL,
    `comment` TEXT NULL,
    `sentiment_label` VARCHAR(50) NULL,
    `is_verified_purchase` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_reviews_user_id` (`user_id`),
    KEY `idx_reviews_product_id` (`product_id`),
    KEY `idx_reviews_order_detail_id` (`order_detail_id`),
    CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng NOTIFICATIONS (Thông báo hệ thống)
CREATE TABLE `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_notifications_user_id` (`user_id`),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng INVENTORY_LOGS (Lịch sử biến động tồn kho)
CREATE TABLE `inventory_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `variant_id` BIGINT NOT NULL,
    `change_quantity` INT NOT NULL,
    `reason` VARCHAR(255) NULL,
    `reference_id` BIGINT NULL,
    `note` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_inventory_logs_variant_id` (`variant_id`),
    CONSTRAINT `fk_inventory_logs_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 1. Insert Roles
INSERT INTO `roles` (`id`, `name`, `description`, `status`) VALUES
(1, 'ROLE_ADMIN', 'Quản trị viên toàn quyền hệ thống', 'ACTIVE'),
(2, 'ROLE_STAFF', 'Nhân viên quản lý sản phẩm và kho hàng', 'ACTIVE'),
(3, 'ROLE_USER',  'Khách hàng mua sắm', 'ACTIVE');

-- 2. Insert Users (Mật khẩu mẫu đã mã hóa BCrypt cho chuỗi '123456')
INSERT INTO `users` (`id`, `email`, `password`, `full_name`, `phone`, `avatar_url`, `auth_provider`, `provider_id`, `role_id`, `status`, `email_verified`) VALUES
(1, 'admin@datn.com', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH', 'Nguyễn Văn Admin', '0901234567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'LOCAL', NULL, 1, 'ACTIVE', TRUE),
(2, 'staff@datn.com', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH', 'Trần Thị Thu Ngân', '0912345678', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'LOCAL', NULL, 2, 'ACTIVE', TRUE),
(3, 'customer1@gmail.com', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGH', 'Lê Hoàng Nam', '0987654321', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'LOCAL', NULL, 3, 'ACTIVE', TRUE),
(4, 'customer2@gmail.com', NULL, 'Phạm Quỳnh Anh', '0977112233', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', 'GOOGLE', 'gg_1029384756', 3, 'ACTIVE', TRUE);

-- 3. Insert User Addresses
INSERT INTO `user_addresses` (`id`, `user_id`, `receiver_name`, `receiver_phone`, `address_line`, `city`, `district`, `ward`, `is_default`) VALUES
(1, 3, 'Lê Hoàng Nam', '0987654321', 'Số 123 Đường Cầu Giấy', 'Hà Nội', 'Quận Cầu Giấy', 'Phường Dịch Vọng', TRUE),
(2, 3, 'Lê Hoàng Nam (Công ty)', '0987654321', 'Tòa nhà FPT, Phố Duy Tân', 'Hà Nội', 'Quận Cầu Giấy', 'Phường Dịch Vọng Hậu', FALSE),
(3, 4, 'Phạm Quỳnh Anh', '0977112233', 'Số 45 Lê Lợi', 'TP Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', TRUE);

-- 4. Insert Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`, `status`) VALUES
(1, 'Áo Thun Nam', 'ao-thun-nam', 'Các mẫu áo thun nam cổ tròn, polo thể thao cao cấp', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', 'ACTIVE'),
(2, 'Quần Jeans', 'quan-jeans', 'Quần jeans nam nữ dáng slim-fit và ống suông', 'https://images.unsplash.com/photo-1542272604-780c96856592', 'ACTIVE'),
(3, 'Giày Sneaker', 'giay-sneaker', 'Giày thể thao vận động và phong cách thời trang', 'https://images.unsplash.com/photo-1549298916-b41d501d3772', 'ACTIVE'),
(4, 'Phụ Kiện', 'phu-kien', 'Thắt lưng, ví da, tất vớ và mũ nón', 'https://images.unsplash.com/photo-1624222247344-550fb60583dc', 'ACTIVE');

-- 5. Insert Brands
INSERT INTO `brands` (`id`, `name`, `slug`, `description`, `logo_url`, `status`) VALUES
(1, 'Nike', 'nike', 'Just Do It - Thương hiệu thể thao toàn cầu', 'https://logo.clearbit.com/nike.com', 'ACTIVE'),
(2, 'Adidas', 'adidas', 'Impossible Is Nothing - Đồ thể thao và phong cách sống', 'https://logo.clearbit.com/adidas.com', 'ACTIVE'),
(3, 'Zara', 'zara', 'Thương hiệu thời trang đường phố thanh lịch từ Tây Ban Nha', 'https://logo.clearbit.com/zara.com', 'ACTIVE'),
(4, 'Uniqlo', 'uniqlo', 'LifeWear - Trang phục thường ngày đơn giản chất lượng cao', 'https://logo.clearbit.com/uniqlo.com', 'ACTIVE');

-- 6. Insert Products
INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `base_price`, `discount_price`, `gender`, `status`) VALUES
(1, 1, 1, 'Áo Thun Thể Thao Nike Dri-FIT', 'ao-thun-the-thao-nike-dri-fit', 'Chất liệu thoáng khí, co giãn 4 chiều hỗ trợ vận động tối đa.', 650000.00, 520000.00, 'MEN', 'ACTIVE'),
(2, 1, 4, 'Áo Polo Nam Uniqlo Dry Pique', 'ao-polo-nam-uniqlo-dry-pique', 'Chất vải Pique thấm hút mồ hôi cực nhanh, thiết kế cổ bẻ thanh lịch.', 490000.00, NULL, 'MEN', 'ACTIVE'),
(3, 2, 3, 'Quần Jeans Slim-Fit Zara', 'quan-jeans-slim-fit-zara', 'Dáng ôm vừa vặn, màu xanh cổ điển dễ phối đồ.', 950000.00, 790000.00, 'UNISEX', 'ACTIVE'),
(4, 3, 2, 'Giày Chạy Bộ Adidas Ultraboost Light', 'giay-chay-bo-adidas-ultraboost-light', 'Đệm Boost êm ái, tối ưu phản hồi lực khi chạy bộ đường dài.', 3800000.00, 3200000.00, 'UNISEX', 'ACTIVE');

-- 7. Insert Product Variants
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `size`, `color`, `price`, `stock_quantity`, `status`) VALUES
(1, 1, 'NIKE-DF-BLK-M', 'M', 'Đen', 520000.00, 50, 'ACTIVE'),
(2, 1, 'NIKE-DF-BLK-L', 'L', 'Đen', 520000.00, 35, 'ACTIVE'),
(3, 1, 'NIKE-DF-WHT-M', 'M', 'Trắng', 520000.00, 40, 'ACTIVE'),
(4, 2, 'UNI-POLO-NVY-L', 'L', 'Xanh Navy', 490000.00, 60, 'ACTIVE'),
(5, 2, 'UNI-POLO-WHT-XL', 'XL', 'Trắng', 490000.00, 25, 'ACTIVE'),
(6, 3, 'ZARA-JEAN-30', '30', 'Xanh Denim', 790000.00, 20, 'ACTIVE'),
(7, 3, 'ZARA-JEAN-31', '31', 'Xanh Denim', 790000.00, 15, 'ACTIVE'),
(8, 4, 'ADI-UB-BLK-42', '42', 'Đen Trắng', 3200000.00, 10, 'ACTIVE');

-- 8. Insert Product Images
INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `is_primary`, `display_order`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', TRUE, 0),
(2, 1, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a', FALSE, 1),
(3, 2, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820', TRUE, 0),
(4, 3, 'https://images.unsplash.com/photo-1542272604-780c96856592', TRUE, 0),
(5, 3, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246', FALSE, 1),
(6, 4, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', TRUE, 0),
(7, 4, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5', FALSE, 1);

-- 9. Insert Wishlists
INSERT INTO `wishlists` (`id`, `user_id`, `product_id`) VALUES
(1, 3, 1),
(2, 3, 4),
(3, 4, 3);

-- 10. Insert Reviews
INSERT INTO `reviews` (`id`, `user_id`, `product_id`, `order_detail_id`, `rating`, `comment`, `sentiment_label`, `is_verified_purchase`, `status`) VALUES
(1, 3, 1, 101, 5, 'Áo mặc cực kỳ thoáng mát, chất vải mềm mịn rất thích.', 'POSITIVE', TRUE, 'PUBLISHED'),
(2, 4, 1, 102, 4, 'Giao hàng nhanh, đóng gói cẩn thận, form áo chuẩn.', 'POSITIVE', TRUE, 'PUBLISHED'),
(3, 3, 4, 103, 5, 'Đệm giày êm ái, chạy 5km không hề bị đau chân.', 'POSITIVE', TRUE, 'PUBLISHED'),
(4, 4, 3, NULL, 3, 'Vải jeans hơi cứng so với mong đợi nhưng form đẹp.', 'NEUTRAL', FALSE, 'PUBLISHED');

-- 11. Insert Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`) VALUES
(1, 3, 'Chào mừng thành viên mới!', 'Cảm ơn bạn đã đăng ký tài khoản tại cửa hàng. Nhập mã HELLO để giảm 10%.', 'SYSTEM', TRUE),
(2, 3, 'Đơn hàng đã được xác nhận', 'Đơn hàng #DH10023 của bạn đang được đóng gói và chuẩn bị giao.', 'ORDER', FALSE),
(3, 4, 'Khuyến mãi đặc biệt cuối tuần', 'Giảm tới 30% cho toàn bộ sản phẩm thương hiệu Nike.', 'PROMOTION', FALSE),
(4, 1, 'Cảnh báo tồn kho', 'Sản phẩm Adidas Ultraboost chỉ còn 10 đôi trong kho.', 'INVENTORY', FALSE);

-- 12. Insert Inventory Logs
INSERT INTO `inventory_logs` (`id`, `variant_id`, `change_quantity`, `reason`, `reference_id`, `note`) VALUES
(1, 1, 50, 'IMPORT', 1001, 'Nhập lô hàng ban đầu từ nhà sản xuất Nike'),
(2, 1, -2, 'SALE', 2001, 'Khách đặt mua online mã đơn #DH10023'),
(3, 4, 60, 'IMPORT', 1002, 'Nhập kho áo polo Uniqlo đợt 1'),
(4, 8, 15, 'IMPORT', 1003, 'Nhập giày Adidas Ultraboost size 42'),
(5, 8, -5, 'SALE', 2002, 'Xuất bán tại cửa hàng offline');
