
package ecommerce.product.controller;

import ecommerce.product.dto.RagProductResponse;
import ecommerce.product.service.RagProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/internal/ai/rag/products")
public class RagProductController {

    private final RagProductService service;

    public RagProductController(RagProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<RagProductResponse> getProducts() {
        return service.getActiveProducts();
    }
}
