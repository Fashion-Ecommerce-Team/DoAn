package ecommerce.wishlist;

import ecommerce.common.exception.BadRequestException;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.repository.ProductRepository;
import ecommerce.user.entity.Role;
import ecommerce.user.entity.User;
import ecommerce.user.service.UserService;
import ecommerce.wishlist.dto.WishlistItemResponse;
import ecommerce.wishlist.entity.Wishlist;
import ecommerce.wishlist.repository.WishlistRepository;
import ecommerce.wishlist.service.WishlistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private WishlistService wishlistService;

    private User user;
    private Product product;
    private Wishlist wishlist;

    @BeforeEach
    void setUp() {
        Role role = new Role("ROLE_CUSTOMER", "Customer");
        user = new User("test@example.com", "pass", "Nguyen Van A", "0987654321", role);
        user.setId(1L);

        product = Product.builder()
                .id(10L)
                .name("Áo Polo Nam")
                .slug("ao-polo-nam")
                .basePrice(new BigDecimal("350000"))
                .status("ACTIVE")
                .build();

        wishlist = Wishlist.builder()
                .id(100L)
                .user(user)
                .product(product)
                .build();
    }

    @Test
    void getWishlist_ReturnsPageResponse() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        Page<Wishlist> page = new PageImpl<>(List.of(wishlist));
        when(wishlistRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class))).thenReturn(page);

        PageResponse<WishlistItemResponse> response = wishlistService.getWishlist("test@example.com", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Áo Polo Nam", response.getContent().get(0).getName());
        assertEquals(10L, response.getContent().get(0).getProductId());
    }

    @Test
    void addToWishlist_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(wishlistRepository.existsByUserIdAndProductId(1L, 10L)).thenReturn(false);
        when(wishlistRepository.save(any(Wishlist.class))).thenReturn(wishlist);

        WishlistItemResponse response = wishlistService.addToWishlist("test@example.com", 10L);

        assertNotNull(response);
        assertEquals(10L, response.getProductId());
        assertEquals("Áo Polo Nam", response.getName());
    }

    @Test
    void addToWishlist_AlreadyExists_ThrowsException() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(wishlistRepository.existsByUserIdAndProductId(1L, 10L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> wishlistService.addToWishlist("test@example.com", 10L));
    }

    @Test
    void addToWishlist_ProductNotFound_ThrowsException() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> wishlistService.addToWishlist("test@example.com", 999L));
    }

    @Test
    void removeFromWishlist_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(wishlistRepository.findByUserIdAndProductId(1L, 10L)).thenReturn(Optional.of(wishlist));

        wishlistService.removeFromWishlist("test@example.com", 10L);

        verify(wishlistRepository).delete(wishlist);
    }

    @Test
    void removeFromWishlist_NotFound_ThrowsException() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(wishlistRepository.findByUserIdAndProductId(1L, 10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> wishlistService.removeFromWishlist("test@example.com", 10L));
    }

    @Test
    void isInWishlist_ReturnsTrueWhenExists() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(wishlistRepository.existsByUserIdAndProductId(1L, 10L)).thenReturn(true);

        boolean result = wishlistService.isInWishlist("test@example.com", 10L);

        assertTrue(result);
    }
}
