package com.shopflow.dto.product;

public record ProductVariantResponse(
        Long id,
        String attributeName,
        String attributeValue,
        Double priceDelta,
        Integer stock
) {
}
