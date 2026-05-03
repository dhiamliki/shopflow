package com.shopflow.dto.auth;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record UpdateToSellerRequest(
        @NotBlank(message = "Please enter your shop name.")
        String shopName,
        String shopDescription,
        List<String> categories
) {
}
