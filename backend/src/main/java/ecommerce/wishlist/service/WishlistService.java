package ecommerce.wishlist.service;

import ecommerce.common.exception.BadRequestException;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.repository.ProductRepository;
import ecommerce.user.entity.User;
import ecommerce.user.service.UserService;
import ecommerce.wishlist.dto.WishlistItemResponse;
import ecommerce.wishlist.entity.Wishlist;
import ecommerce.wishlist.repository.WishlistRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    public WishlistService(WishlistRepository wishlistRepository,
                           ProductRepository productRepository,
                           UserService userService) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public PageResponse<WishlistItemResponse> getWishlist(String email, int page, int size) {
        User user = userService.getUserByEmail(email);

        int pageNo = Math.max(page, 0);
        int pageSize = (size > 0 && size <= 100) ? size : 12;
        Pageable pageable = PageRequest.of(pageNo, pageSize);

        Page<Wishlist> wishlistPage = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        List<WishlistItemResponse> content = wishlistPage.getContent().stream()
                .map(WishlistItemResponse::fromEntity)
                .toList();

        return PageResponse.<WishlistItemResponse>builder()
                .content(content)
                .pageNo(wishlistPage.getNumber())
                .pageSize(wishlistPage.getSize())
                .totalElements(wishlistPage.getTotalElements())
                .totalPages(wishlistPage.getTotalPages())
                .last(wishlistPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getAllWishlist(String email) {
        User user = userService.getUserByEmail(email);
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(WishlistItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public WishlistItemResponse addToWishlist(String email, Long productId) {
        User user = userService.getUserByEmail(email);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với ID: " + productId));

        if (wishlistRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw new BadRequestException("Sản phẩm đã có trong danh sách yêu thích!");
        }

        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .product(product)
                .build();

        Wishlist saved = wishlistRepository.save(wishlist);
        return WishlistItemResponse.fromEntity(saved);
    }

    @Transactional
    public void removeFromWishlist(String email, Long productId) {
        User user = userService.getUserByEmail(email);

        Wishlist wishlist = wishlistRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không có trong danh sách yêu thích!"));

        wishlistRepository.delete(wishlist);
    }

    @Transactional(readOnly = true)
    public boolean isInWishlist(String email, Long productId) {
        User user = userService.getUserByEmail(email);
        return wishlistRepository.existsByUserIdAndProductId(user.getId(), productId);
    }
}
