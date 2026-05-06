package com.shopflow.dto.cart;

import java.util.List;

public record CartResponse(
        Long id,
        List<CartItemResponse> items,
        String appliedCoupon,
        Double subtotal,
        Double discount,
        Double shippingFee,
        Double totalTtc
) {
}
