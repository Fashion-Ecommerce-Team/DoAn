package ecommerce.address;

import ecommerce.address.dto.AddressRequest;
import ecommerce.address.dto.AddressResponse;
import ecommerce.address.entity.Address;
import ecommerce.address.repository.AddressRepository;
import ecommerce.address.service.AddressService;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.user.entity.Role;
import ecommerce.user.entity.User;
import ecommerce.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private AddressService addressService;

    private User user;
    private Address address1;

    @BeforeEach
    void setUp() {
        Role role = new Role("ROLE_CUSTOMER", "Customer");
        user = new User("test@example.com", "pass", "Nguyen Van A", "0987654321", role);
        user.setId(1L);

        address1 = Address.builder()
                .id(10L)
                .user(user)
                .receiverName("Nguyen Van A")
                .receiverPhone("0987654321")
                .addressLine("123 Duong ABC")
                .city("Ha Noi")
                .district("Cau Giay")
                .ward("Dich Vong")
                .isDefault(true)
                .build();
    }

    @Test
    void getUserAddresses_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(1L)).thenReturn(List.of(address1));

        List<AddressResponse> list = addressService.getUserAddresses("test@example.com");

        assertEquals(1, list.size());
        assertEquals("Nguyen Van A", list.get(0).getReceiverName());
        assertTrue(list.get(0).getIsDefault());
    }

    @Test
    void createAddress_FirstAddress_AutomaticallyDefault() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(addressRepository.existsByUserId(1L)).thenReturn(false);
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> {
            Address a = invocation.getArgument(0);
            a.setId(11L);
            return a;
        });

        AddressRequest request = AddressRequest.builder()
                .receiverName("Tran Thi B")
                .receiverPhone("0912345678")
                .addressLine("456 Duong XYZ")
                .city("Ha Noi")
                .district("Ba Dinh")
                .ward("Kim Ma")
                .isDefault(false)
                .build();

        AddressResponse response = addressService.createAddress("test@example.com", request);

        assertNotNull(response);
        assertTrue(response.getIsDefault()); // First address automatically becomes default
        verify(addressRepository).resetDefaultAddressByUserId(1L);
    }

    @Test
    void updateAddress_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(address1));
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddressRequest updateReq = AddressRequest.builder()
                .receiverName("Nguyen Van A Updated")
                .receiverPhone("0987654321")
                .addressLine("789 Duong New")
                .city("Ha Noi")
                .district("Cau Giay")
                .ward("Dich Vong")
                .isDefault(true)
                .build();

        AddressResponse response = addressService.updateAddress("test@example.com", 10L, updateReq);

        assertEquals("Nguyen Van A Updated", response.getReceiverName());
        assertEquals("789 Duong New", response.getAddressLine());
    }

    @Test
    void deleteAddress_Success() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(addressRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(address1));

        addressService.deleteAddress("test@example.com", 10L);

        verify(addressRepository).delete(address1);
    }

    @Test
    void getAddressById_NotFound_ThrowsException() {
        when(userService.getUserByEmail("test@example.com")).thenReturn(user);
        when(addressRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> addressService.getAddressById("test@example.com", 99L));
    }
}
