package com.shopflow.dto.review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long productId,
        Long userId,
        String userName,
        Integer rating,
        String comment,
        boolean approved,
        LocalDateTime createdAt
) {
}
