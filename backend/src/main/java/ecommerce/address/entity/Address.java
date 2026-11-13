package ecommerce.address.entity;

import ecommerce.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 20)
    private String receiverPhone;

    @Column(name = "province", nullable = false, length = 100)
    private String province;

    @Column(name = "district", nullable = false, length = 100)
    private String district;

    @Column(name = "ward", nullable = false, length = 100)
    private String ward;

    @Column(name = "street_address", nullable = false, length = 255)
    private String streetAddress;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Backward compatibility aliases
    public String getCity() {
        return province;
    }

    public void setCity(String city) {
        this.province = city;
    }

    public String getAddressLine() {
        return streetAddress;
    }

    public void setAddressLine(String addressLine) {
        this.streetAddress = addressLine;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isDefault == null) {
            this.isDefault = false;
        }
    }

    public static class AddressBuilder {
        public AddressBuilder addressLine(String addressLine) {
            this.streetAddress = addressLine;
            return this;
        }

        public AddressBuilder city(String city) {
            this.province = city;
            return this;
        }
    }
}
