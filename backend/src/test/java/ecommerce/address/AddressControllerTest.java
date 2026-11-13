package ecommerce.address;

import com.fasterxml.jackson.databind.ObjectMapper;
import ecommerce.address.controller.AddressController;
import ecommerce.address.dto.AddressRequest;
import ecommerce.address.dto.AddressResponse;
import ecommerce.address.service.AddressService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AddressController.class)
@AutoConfigureMockMvc(addFilters = false)
class AddressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AddressService addressService;

    @MockBean
    private ecommerce.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private ecommerce.security.CustomUserDetailsService customUserDetailsService;

    private AddressResponse sampleAddress;

    @BeforeEach
    void setUp() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("user@example.com", null, null);
        SecurityContextHolder.getContext().setAuthentication(auth);

        sampleAddress = AddressResponse.builder()
                .id(1L)
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
    void getUserAddresses_Returns200() throws Exception {
        when(addressService.getUserAddresses("user@example.com")).thenReturn(List.of(sampleAddress));

        mockMvc.perform(get("/api/v1/addresses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].receiverName").value("Nguyen Van A"));
    }

    @Test
    void getAddressById_Returns200() throws Exception {
        when(addressService.getAddressById("user@example.com", 1L)).thenReturn(sampleAddress);

        mockMvc.perform(get("/api/v1/addresses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void createAddress_Valid_Returns201() throws Exception {
        AddressRequest request = AddressRequest.builder()
                .receiverName("Tran Van B")
                .receiverPhone("0912345678")
                .addressLine("456 Duong XYZ")
                .city("Ha Noi")
                .district("Ba Dinh")
                .ward("Kim Ma")
                .isDefault(true)
                .build();

        when(addressService.createAddress(eq("user@example.com"), any(AddressRequest.class)))
                .thenReturn(sampleAddress);

        mockMvc.perform(post("/api/v1/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Thêm địa chỉ giao hàng thành công!"));
    }

    @Test
    void createAddress_InvalidInput_Returns400() throws Exception {
        AddressRequest request = AddressRequest.builder()
                .receiverName("") // Invalid empty receiverName
                .receiverPhone("123") // Invalid phone format
                .build();

        mockMvc.perform(post("/api/v1/addresses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void updateAddress_Returns200() throws Exception {
        AddressRequest request = AddressRequest.builder()
                .receiverName("Tran Van B Updated")
                .receiverPhone("0912345678")
                .addressLine("456 Duong XYZ")
                .city("Ha Noi")
                .district("Ba Dinh")
                .ward("Kim Ma")
                .isDefault(true)
                .build();

        when(addressService.updateAddress(eq("user@example.com"), eq(1L), any(AddressRequest.class)))
                .thenReturn(sampleAddress);

        mockMvc.perform(put("/api/v1/addresses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void deleteAddress_Returns200() throws Exception {
        mockMvc.perform(delete("/api/v1/addresses/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Xóa địa chỉ giao hàng thành công!"));

        verify(addressService).deleteAddress("user@example.com", 1L);
    }

    @Test
    void setDefaultAddress_Returns200() throws Exception {
        when(addressService.setDefaultAddress("user@example.com", 1L)).thenReturn(sampleAddress);

        mockMvc.perform(patch("/api/v1/addresses/1/default"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
