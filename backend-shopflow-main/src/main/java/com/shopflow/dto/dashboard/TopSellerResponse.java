package com.shopflow.dto.dashboard;

public record TopSellerResponse(
        Long sellerId,
        String sellerName,
        Double revenue
) {
}
