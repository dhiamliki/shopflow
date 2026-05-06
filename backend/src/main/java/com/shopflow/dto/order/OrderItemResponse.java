package com.shopflow.dto.order;

public record OrderItemResponse(
        Long productId,
        String productName,
        Long variantId,
        String variantLabel,
        Integer quantity,
        Double unitPrice,
        Double totalPrice
) {
}
