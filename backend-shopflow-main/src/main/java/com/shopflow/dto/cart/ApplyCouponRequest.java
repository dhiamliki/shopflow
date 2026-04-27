package com.shopflow.dto.cart;

import jakarta.validation.constraints.NotBlank;

public record ApplyCouponRequest(
        @NotBlank String code
) {
}
