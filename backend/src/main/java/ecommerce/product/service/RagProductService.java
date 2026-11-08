
package ecommerce.product.service;

import ecommerce.product.dto.RagProductResponse;
import ecommerce.product.entity.Product;
import ecommerce.product.entity.ProductVariant;
import ecommerce.product.repository.RagProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class RagProductService {

    private final RagProductRepository repository;

    public RagProductService(RagProductRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RagProductResponse> getActiveProducts() {
        return repository.findActiveProductsForRag()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private RagProductResponse toResponse(Product product) {
        BigDecimal currentPrice = product.getDiscountPrice() != null
                ? product.getDiscountPrice()
                : product.getBasePrice();

        List<RagProductResponse.VariantInfo> variants =
                product.getVariants() == null
                        ? List.of()
                        : product.getVariants().stream()
                            .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()))
                            .map(this::toVariantInfo)
                            .toList();

        return new RagProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getSlug(),
                product.getBasePrice(),
                product.getDiscountPrice(),
                currentPrice,
                product.getGender(),
                product.getCategory() != null
                        ? product.getCategory().getName() : null,
                product.getBrand() != null
                        ? product.getBrand().getName() : null,
                variants
        );
    }

    private RagProductResponse.VariantInfo toVariantInfo(
            ProductVariant variant
    ) {
        return new RagProductResponse.VariantInfo(
                variant.getId(),
                variant.getSize(),
                variant.getColor(),
                variant.getStockQuantity()
        );
    }
}
