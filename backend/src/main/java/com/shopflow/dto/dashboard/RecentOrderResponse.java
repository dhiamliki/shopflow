package com.shopflow.dto.dashboard;

import com.shopflow.entities.OrderStatus;

import java.time.LocalDateTime;

public record RecentOrderResponse(
        Long orderId,
        String orderNumber,
        OrderStatus status,
        Double totalAmount,
        LocalDateTime createdAt
) {
}
