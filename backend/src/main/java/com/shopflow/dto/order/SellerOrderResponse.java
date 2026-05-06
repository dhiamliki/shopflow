package com.shopflow.dto.order;

import com.shopflow.entities.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record SellerOrderResponse(
        Long id,
        String orderNumber,
        Long buyerId,
        String buyerName,
        String buyerEmail,
        OrderStatus status,
        LocalDateTime createdAt,
        LocalDateTime statusUpdatedAt,
        Double sellerTotal,
        List<SellerOrderItemResponse> items
) {
}
