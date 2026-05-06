package com.shopflow.dto.account;

public record SellerSettingsResponse(
        Long sellerId,
        String sellerName,
        String email,
        String shopName,
        String description,
        String logoUrl,
        Double rating
) {
}
