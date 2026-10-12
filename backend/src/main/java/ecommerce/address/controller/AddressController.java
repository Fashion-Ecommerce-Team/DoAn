package ecommerce.address.controller;

import ecommerce.address.dto.AddressRequest;
import ecommerce.address.dto.AddressResponse;
import ecommerce.address.service.AddressService;
import ecommerce.common.response.ApiResponse;
import ecommerce.common.util.SecurityUtils;
import ecommerce.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@Tag(name = "User Addresses", description = "APIs quản lý sổ địa chỉ giao hàng của người dùng")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách địa chỉ giao hàng", description = "Lấy danh sách tất cả địa chỉ nhận hàng của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getUserAddresses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        List<AddressResponse> addresses = addressService.getUserAddresses(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách địa chỉ thành công!", addresses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một địa chỉ giao hàng", description = "Lấy thông tin chi tiết của một địa chỉ theo ID")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        AddressResponse address = addressService.getAddressById(email, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin địa chỉ thành công!", address));
    }

    @PostMapping
    @Operation(summary = "Thêm địa chỉ giao hàng mới", description = "Tạo mới một địa chỉ giao hàng cho người dùng")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AddressRequest request) {
        String email = resolveEmail(userDetails);
        AddressResponse created = addressService.createAddress(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm địa chỉ giao hàng thành công!", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin địa chỉ giao hàng", description = "Cập nhật địa chỉ nhận hàng theo ID")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AddressRequest request) {
        String email = resolveEmail(userDetails);
        AddressResponse updated = addressService.updateAddress(email, id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật địa chỉ thành công!", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa địa chỉ giao hàng", description = "Xóa một địa chỉ nhận hàng theo ID")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        addressService.deleteAddress(email, id);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa chỉ giao hàng thành công!", null));
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Đặt làm địa chỉ mặc định", description = "Thiết lập địa chỉ theo ID làm địa chỉ giao hàng mặc định")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String email = resolveEmail(userDetails);
        AddressResponse updated = addressService.setDefaultAddress(email, id);
        return ResponseEntity.ok(ApiResponse.success("Thiết lập địa chỉ mặc định thành công!", updated));
    }

    private String resolveEmail(CustomUserDetails userDetails) {
        if (userDetails != null && userDetails.getUsername() != null) {
            return userDetails.getUsername();
        }
        return SecurityUtils.getCurrentUserEmail();
    }
}
