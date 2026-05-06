package com.shopflow.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record ProductRequest(
        @NotBlank String name,
        @NotBlank String description,
        @NotNull @Positive Double price,
        @PositiveOrZero Double promoPrice,
        @NotNull @PositiveOrZero Integer stock,
        @NotEmpty List<Long> categoryIds,
        List<String> imageUrls,
        List<ProductVariantRequest> variants
) {
}
