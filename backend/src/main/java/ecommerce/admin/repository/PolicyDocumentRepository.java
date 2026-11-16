package ecommerce.admin.repository;

import ecommerce.admin.entity.PolicyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PolicyDocumentRepository extends JpaRepository<PolicyDocument, Long>, JpaSpecificationExecutor<PolicyDocument> {

    Optional<PolicyDocument> findBySlug(String slug);

    boolean existsByTitleIgnoreCase(String title);

    boolean existsByTitleIgnoreCaseAndIdNot(String title, Long id);

    boolean existsBySlug(String slug);
}
