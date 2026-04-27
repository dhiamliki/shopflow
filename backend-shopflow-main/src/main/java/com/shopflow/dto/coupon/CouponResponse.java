package com.shopflow.dto.coupon;

import com.shopflow.entities.CouponType;

import java.time.LocalDateTime;

public record CouponResponse(
        Long id,
        String code,
        CouponType type,
        Double value,
        Double minOrderAmount,
        LocalDateTime expiresAt,
        Integer maxUsages,
        Integer currentUsages,
        boolean active
) {
}
