package com.shopflow.controllers;

import com.shopflow.dto.coupon.CouponRequest;
import com.shopflow.dto.coupon.CouponResponse;
import com.shopflow.services.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponAdminController {

    private final CouponService couponService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> create(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.create(
                request.code(),
                request.type(),
                request.value(),
                request.minOrderAmount(),
                request.expiresAt(),
                request.maxUsages()
        ));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(couponService.update(
                id,
                request.code(),
                request.type(),
                request.value(),
                request.minOrderAmount(),
                request.expiresAt(),
                request.maxUsages(),
                request.active()
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<CouponResponse> validate(@PathVariable String code) {
        return ResponseEntity.ok(couponService.validate(code));
    }
}
