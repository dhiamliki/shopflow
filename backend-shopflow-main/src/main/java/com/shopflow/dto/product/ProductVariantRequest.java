package com.shopflow.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProductVariantRequest(
        @NotBlank String attributeName,
        @NotBlank String attributeValue,
        Double priceDelta,
        @NotNull Integer stock
) {
}
