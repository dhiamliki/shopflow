package com.shopflow.dto.order;

public record SellerOrderItemResponse(
        Long productId,
        String productName,
        Long variantId,
        String variantLabel,
        Integer quantity,
        Double unitPrice,
        Double totalPrice
) {
}
