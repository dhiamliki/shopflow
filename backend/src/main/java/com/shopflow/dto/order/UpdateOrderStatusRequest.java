package com.shopflow.dto.order;

import com.shopflow.entities.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull OrderStatus status
) {
}
