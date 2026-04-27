package com.shopflow.dto.product;

public record ProductFilterRequest(
        String search,
        Long categoryId,
        Long sellerId,
        Boolean promoOnly,
        Double minPrice,
        Double maxPrice,
        String sortBy,
        String sortDirection,
        Integer page,
        Integer size
) {
}
