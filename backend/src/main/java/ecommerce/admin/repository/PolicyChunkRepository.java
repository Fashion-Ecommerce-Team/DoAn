package ecommerce.admin.repository;

import ecommerce.admin.entity.PolicyChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyChunkRepository extends JpaRepository<PolicyChunk, Long> {

    List<PolicyChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);

    void deleteByDocumentId(Long documentId);

    long countByDocumentId(Long documentId);
}
