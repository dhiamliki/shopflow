package com.shopflow.dto.account;

import jakarta.validation.constraints.NotBlank;

public record UpdateSellerSettingsRequest(
        @NotBlank(message = "Shop name is required")
        String shopName,
        String description,
        String logoUrl
) {
}
