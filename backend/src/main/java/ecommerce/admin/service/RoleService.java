package ecommerce.admin.service;

import ecommerce.admin.dto.response.RoleResponse;
import java.util.List;

public interface RoleService {
    List<RoleResponse> getAll();
}
