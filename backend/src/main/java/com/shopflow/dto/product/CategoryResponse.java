package com.shopflow.dto.product;

import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        Long parentId,
        List<CategoryResponse> children
) {
}
