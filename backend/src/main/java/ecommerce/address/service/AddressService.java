package ecommerce.address.service;

import ecommerce.address.dto.AddressRequest;
import ecommerce.address.dto.AddressResponse;
import ecommerce.address.entity.Address;
import ecommerce.address.repository.AddressRepository;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.user.entity.User;
import ecommerce.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserService userService;

    public AddressService(AddressRepository addressRepository, UserService userService) {
        this.addressRepository = addressRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getUserAddresses(String email) {
        User user = userService.getUserByEmail(email);
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
        return addresses.stream()
                .map(AddressResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AddressResponse getAddressById(String email, Long addressId) {
        User user = userService.getUserByEmail(email);
        Address address = findUserAddress(addressId, user.getId());
        return AddressResponse.fromEntity(address);
    }

    @Transactional
    public AddressResponse createAddress(String email, AddressRequest request) {
        User user = userService.getUserByEmail(email);

        boolean isFirst = !addressRepository.existsByUserId(user.getId());
        boolean shouldBeDefault = Boolean.TRUE.equals(request.getIsDefault()) || isFirst;

        if (shouldBeDefault) {
            addressRepository.resetDefaultAddressByUserId(user.getId());
        }

        Address address = Address.builder()
                .user(user)
                .receiverName(request.getReceiverName().trim())
                .receiverPhone(request.getReceiverPhone().trim())
                .streetAddress(request.resolveStreetAddress())
                .province(request.resolveProvince())
                .district(request.getDistrict().trim())
                .ward(request.getWard().trim())
                .isDefault(shouldBeDefault)
                .build();

        Address saved = addressRepository.save(address);
        return AddressResponse.fromEntity(saved);
    }

    @Transactional
    public AddressResponse updateAddress(String email, Long addressId, AddressRequest request) {
        User user = userService.getUserByEmail(email);
        Address address = findUserAddress(addressId, user.getId());

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            addressRepository.resetOtherDefaultAddresses(user.getId(), addressId);
            address.setIsDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault())) {
            address.setIsDefault(false);
        }

        address.setReceiverName(request.getReceiverName().trim());
        address.setReceiverPhone(request.getReceiverPhone().trim());
        address.setStreetAddress(request.resolveStreetAddress());
        address.setProvince(request.resolveProvince());
        address.setDistrict(request.getDistrict().trim());
        address.setWard(request.getWard().trim());

        Address updated = addressRepository.save(address);
        return AddressResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteAddress(String email, Long addressId) {
        User user = userService.getUserByEmail(email);
        Address address = findUserAddress(addressId, user.getId());

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);
        addressRepository.flush();

        if (wasDefault) {
            addressRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId()).ifPresent(other -> {
                other.setIsDefault(true);
                addressRepository.save(other);
            });
        }
    }

    @Transactional
    public AddressResponse setDefaultAddress(String email, Long addressId) {
        User user = userService.getUserByEmail(email);
        Address address = findUserAddress(addressId, user.getId());

        addressRepository.resetDefaultAddressByUserId(user.getId());
        address.setIsDefault(true);

        Address updated = addressRepository.save(address);
        return AddressResponse.fromEntity(updated);
    }

    private Address findUserAddress(Long addressId, Long userId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ giao hàng với id: " + addressId));
    }
}
