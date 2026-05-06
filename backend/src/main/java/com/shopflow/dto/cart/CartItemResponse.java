package com.shopflow.dto.cart;

public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        Long variantId,
        String variantLabel,
        Integer quantity,
        Double unitPrice,
        Double totalPrice
) {
}
