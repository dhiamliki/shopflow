package com.shopflow.dto.order;

import com.shopflow.entities.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        OrderStatus status,
        Double subtotal,
        Double discountAmount,
        Double shippingFee,
        Double totalTtc,
        Double totalAmount,
        Long shippingAddressId,
        String shippingAddress,
        String appliedCouponCode,
        boolean refunded,
        Double refundAmount,
        boolean isNew,
        LocalDateTime createdAt,
        LocalDateTime statusUpdatedAt,
        List<OrderItemResponse> items
) {
}
