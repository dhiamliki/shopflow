package com.shopflow.dto.order;

import com.shopflow.entities.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
        @NotNull Long addressId,
        @NotNull PaymentMethod paymentMethod
) {
}
