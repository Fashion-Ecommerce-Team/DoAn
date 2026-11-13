package ecommerce.product.repository;

import ecommerce.product.dto.ProductFilterRequest;
import ecommerce.product.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> filter(ProductFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Status: default to ACTIVE if null/blank
            String status = (filter.getStatus() != null && !filter.getStatus().isBlank())
                    ? filter.getStatus()
                    : "ACTIVE";
            predicates.add(cb.equal(root.get("status"), status));
            predicates.add(cb.isNull(root.get("deletedAt")));

            // 2. Keyword search on product name or description
            if (filter.getKeyword() != null && !filter.getKeyword().isBlank()) {
                String pattern = "%" + filter.getKeyword().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(nameMatch, descMatch));
            }

            // 3. Category filter
            if (filter.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), filter.getCategoryId()));
            } else if (filter.getCategorySlug() != null && !filter.getCategorySlug().isBlank()) {
                predicates.add(cb.equal(root.get("category").get("slug"), filter.getCategorySlug().trim()));
            }

            // 4. Brand filter
            if (filter.getBrandId() != null) {
                predicates.add(cb.equal(root.get("brand").get("id"), filter.getBrandId()));
            } else if (filter.getBrandSlug() != null && !filter.getBrandSlug().isBlank()) {
                predicates.add(cb.equal(root.get("brand").get("slug"), filter.getBrandSlug().trim()));
            }

            // 5. Gender filter
            if (filter.getGender() != null && !filter.getGender().isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("gender")), filter.getGender().trim().toUpperCase()));
            }

            // 6. Price range: compare effective price (coalesce discount_price, base_price)
            if (filter.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        cb.coalesce(root.get("discountPrice"), root.get("basePrice")),
                        filter.getMinPrice()
                ));
            }

            if (filter.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        cb.coalesce(root.get("discountPrice"), root.get("basePrice")),
                        filter.getMaxPrice()
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
