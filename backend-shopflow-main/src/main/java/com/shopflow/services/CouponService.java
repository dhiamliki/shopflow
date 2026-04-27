package com.shopflow.services;

import com.shopflow.dto.coupon.CouponResponse;
import com.shopflow.entities.Coupon;
import com.shopflow.entities.CouponType;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public List<CouponResponse> allCoupons() {
        return couponRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CouponResponse create(String code, CouponType type, Double value, Double minOrder, LocalDateTime expiresAt, Integer maxUsages) {
        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new BadRequestException("Coupon code already exists");
        }
        Coupon coupon = Coupon.builder()
                .code(code.toUpperCase())
                .type(type)
                .value(value)
                .minOrderAmount(minOrder == null ? 0.0 : minOrder)
                .expiresAt(expiresAt)
                .maxUsages(maxUsages)
                .active(true)
                .build();
        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public CouponResponse update(
            Long id,
            String code,
            CouponType type,
            Double value,
            Double minOrderAmount,
            LocalDateTime expiresAt,
            Integer maxUsages,
            Boolean active
    ) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Coupon not found"));

        if (code != null && !code.equalsIgnoreCase(coupon.getCode())
                && couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new BadRequestException("Coupon code already exists");
        }

        if (code != null) {
            coupon.setCode(code.toUpperCase());
        }
        if (type != null) {
            coupon.setType(type);
        }
        if (value != null) {
            coupon.setValue(value);
        }
        if (minOrderAmount != null) {
            coupon.setMinOrderAmount(minOrderAmount);
        }
        if (expiresAt != null) {
            coupon.setExpiresAt(expiresAt);
        }
        if (maxUsages != null) {
            coupon.setMaxUsages(maxUsages);
        }
        if (active != null) {
            coupon.setActive(active);
        }
        return toResponse(couponRepository.save(coupon));
    }

    @Transactional
    public void delete(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Coupon not found"));
        couponRepository.delete(coupon);
    }

    @Transactional(readOnly = true)
    public CouponResponse validate(String code) {
        return toResponse(validateEntity(code));
    }

    @Transactional(readOnly = true)
    public Coupon validateEntity(String code) {
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .orElseThrow(() -> new NotFoundException("Coupon not found or inactive"));
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Coupon has expired");
        }
        if (coupon.getMaxUsages() != null && coupon.getCurrentUsages() >= coupon.getMaxUsages()) {
            throw new BadRequestException("Coupon usage limit reached");
        }
        return coupon;
    }

    @Transactional
    public void markCouponUsed(String code) {
        if (code == null || code.isBlank()) {
            return;
        }
        Coupon coupon = validateEntity(code);
        coupon.setCurrentUsages(coupon.getCurrentUsages() + 1);
        couponRepository.save(coupon);
    }

    private CouponResponse toResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getType(),
                coupon.getValue(),
                coupon.getMinOrderAmount(),
                coupon.getExpiresAt(),
                coupon.getMaxUsages(),
                coupon.getCurrentUsages(),
                coupon.isActive()
        );
    }
}
