package ecommerce.admin.repository;

import ecommerce.admin.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("adminRoleRepository")
public interface RoleRepository extends JpaRepository<Role, Long> {
}
