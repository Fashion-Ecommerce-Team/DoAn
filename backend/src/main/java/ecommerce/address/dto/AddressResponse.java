package ecommerce.address.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import ecommerce.address.entity.Address;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressResponse {

    private Long id;
    private Long userId;
    private String receiverName;
    private String receiverPhone;
    private String province;
    private String city;
    private String district;
    private String ward;
    private String streetAddress;
    private String addressLine;
    private Boolean isDefault;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    public static AddressResponse fromEntity(Address address) {
        if (address == null) {
            return null;
        }
        return AddressResponse.builder()
                .id(address.getId())
                .userId(address.getUser() != null ? address.getUser().getId() : null)
                .receiverName(address.getReceiverName())
                .receiverPhone(address.getReceiverPhone())
                .province(address.getProvince())
                .city(address.getProvince())
                .district(address.getDistrict())
                .ward(address.getWard())
                .streetAddress(address.getStreetAddress())
                .addressLine(address.getStreetAddress())
                .isDefault(address.getIsDefault())
                .createdAt(address.getCreatedAt())
                .build();
    }
}
