package ecommerce.admin.service;

import ecommerce.admin.dto.request.UserRequest;
import ecommerce.admin.dto.response.UserAddressResponse;
import ecommerce.admin.dto.response.UserResponse;
import ecommerce.common.response.PageResponse;

import java.util.List;

public interface UserService {
    PageResponse<UserResponse> getList(String search, String status, int page, int size);
    UserResponse getById(Long id);
    UserResponse update(Long id, UserRequest request);
    void updateStatus(Long id, String status);
    void updateRole(Long id, Long roleId);
    void delete(Long id);
    List<UserAddressResponse> getAddresses(Long userId);
}
