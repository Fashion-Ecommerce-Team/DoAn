package ecommerce.admin.service.impl;

import ecommerce.admin.dto.request.UserRequest;
import ecommerce.admin.dto.response.UserAddressResponse;
import ecommerce.admin.dto.response.UserResponse;
import ecommerce.admin.entity.User;
import ecommerce.admin.repository.UserAddressRepository;
import ecommerce.admin.repository.UserRepository;
import ecommerce.admin.service.UserService;
import ecommerce.common.exception.ResourceNotFoundException;
import ecommerce.common.response.PageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.beans.BeanUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository repository;

    @Autowired
    private UserAddressRepository addressRepository;

    @Override
    public PageResponse<UserResponse> getList(String search, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<User> spec = Specification.where(null);
        if (search != null && !search.trim().isEmpty()) {
            String keyword = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("fullName")), keyword),
                cb.like(cb.lower(root.get("email")), keyword),
                cb.and(cb.isNotNull(root.get("phone")), cb.like(cb.lower(root.get("phone")), keyword))
            ));
        }
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status.trim()));
        }
        Page<User> pageResult = repository.findAll(spec, pageable);
        return PageResponse.of(pageResult.map(this::mapToResponse));
    }

    @Override
    public UserResponse getById(Long id) {
        return mapToResponse(findById(id));
    }

    @Override
    public UserResponse update(Long id, UserRequest request) {
        User entity = findById(id);
        BeanUtils.copyProperties(request, entity, "id", "createdAt", "updatedAt");
        return mapToResponse(repository.save(entity));
    }

    @Override
    public void updateStatus(Long id, String status) {
        User entity = findById(id);
        entity.setStatus(status);
        repository.save(entity);
    }

    @Override
    public void updateRole(Long id, Long roleId) {
        User entity = findById(id);
        entity.setRoleId(roleId);
        repository.save(entity);
    }

    @Override
    public void delete(Long id) {
        User entity = findById(id);
        entity.setStatus("DELETED");
        repository.save(entity);
    }

    @Override
    public List<UserAddressResponse> getAddresses(Long userId) {
        return addressRepository.findByUserId(userId).stream().map(addr -> {
            UserAddressResponse res = new UserAddressResponse();
            BeanUtils.copyProperties(addr, res);
            return res;
        }).collect(Collectors.toList());
    }

    private User findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }

    private UserResponse mapToResponse(User entity) {
        UserResponse response = new UserResponse();
        BeanUtils.copyProperties(entity, response);
        return response;
    }
}
