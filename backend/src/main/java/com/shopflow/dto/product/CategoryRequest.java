package com.shopflow.dto.product;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank String name,
        String description,
        Long parentId
) {
}
