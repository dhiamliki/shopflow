package com.shopflow.controllers;

import com.shopflow.dto.product.ProductFilterRequest;
import com.shopflow.dto.product.ProductRequest;
import com.shopflow.dto.product.ProductResponse;
import com.shopflow.services.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, name = "categoryId") List<Long> categoryIds,
            @RequestParam(required = false, name = "categoryIds") List<Long> categoryIdsAlias,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) Boolean promo,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDirection,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "12") Integer size
    ) {
        ProductFilterRequest request = new ProductFilterRequest(
                search,
                mergeCategoryIds(categoryIds, categoryIdsAlias),
                sellerId,
                promo,
                minPrice,
                maxPrice,
                sortBy,
                sortDirection,
                page,
                size
        );
        return ResponseEntity.ok(productService.filterProducts(request));
    }

    private List<Long> mergeCategoryIds(List<Long> categoryIds, List<Long> categoryIdsAlias) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return categoryIdsAlias;
        }
        if (categoryIdsAlias == null || categoryIdsAlias.isEmpty()) {
            return categoryIds;
        }
        return java.util.stream.Stream.concat(categoryIds.stream(), categoryIdsAlias.stream())
                .distinct()
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> byId(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductResponse>> search(@RequestParam("q") String q) {
        return ResponseEntity.ok(productService.searchProducts(q));
    }

    @GetMapping("/top-selling")
    public ResponseEntity<List<ProductResponse>> topSelling() {
        return ResponseEntity.ok(productService.topSellingProducts());
    }
}
