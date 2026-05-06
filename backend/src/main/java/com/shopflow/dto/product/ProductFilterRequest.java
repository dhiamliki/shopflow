package com.shopflow.dto.product;

import java.util.List;

public record ProductFilterRequest(
        String search,
        List<Long> categoryIds,
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
