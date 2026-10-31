package ecommerce.admin.repository;

import ecommerce.admin.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    @Query("SELECT u.id FROM User u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :kw, '%'))")
    List<Long> findIdsByKeyword(@Param("kw") String keyword);

    @Query("SELECT u FROM User u WHERE u.createdAt >= :since")
    List<User> findUsersSince(@Param("since") LocalDateTime since);
}
