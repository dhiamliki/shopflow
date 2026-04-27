package com.shopflow.dto.dashboard;

public record TopProductResponse(
        Long productId,
        String productName,
        Long quantitySold,
        Double revenue
) {
}
