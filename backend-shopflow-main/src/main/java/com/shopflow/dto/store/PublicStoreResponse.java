package com.shopflow.dto.store;

public record PublicStoreResponse(
        Long sellerId,
        String sellerName,
        String shopName,
        String description,
        String logoUrl,
        Double rating,
        Long activeProductCount
) {
}
