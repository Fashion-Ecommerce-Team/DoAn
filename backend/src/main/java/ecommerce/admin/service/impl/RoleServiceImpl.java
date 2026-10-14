package ecommerce.admin.service.impl;

import ecommerce.admin.dto.response.RoleResponse;
import ecommerce.admin.repository.RoleRepository;
import ecommerce.admin.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.beans.BeanUtils;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleServiceImpl implements RoleService {
    @Autowired
    private RoleRepository repository;

    @Override
    public List<RoleResponse> getAll() {
        return repository.findAll().stream().map(role -> {
            RoleResponse response = new RoleResponse();
            BeanUtils.copyProperties(role, response);
            return response;
        }).collect(Collectors.toList());
    }
}
