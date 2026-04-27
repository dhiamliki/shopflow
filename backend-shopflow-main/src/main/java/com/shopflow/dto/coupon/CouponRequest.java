package com.shopflow.dto.coupon;

import com.shopflow.entities.CouponType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CouponRequest(
        @NotBlank String code,
        @NotNull CouponType type,
        @NotNull @Min(0) Double value,
        @Min(0) Double minOrderAmount,
        @Future LocalDateTime expiresAt,
        @Min(1) Integer maxUsages,
        Boolean active
) {
}
