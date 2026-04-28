package com.shopflow.dto.dashboard;

public record SellerProfileResponse(
        Long sellerId,
        String sellerName,
        String shopName,
        String description,
        String logoUrl,
        Double rating
) {
}
