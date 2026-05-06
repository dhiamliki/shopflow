package com.shopflow.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponType type;

    @Column(nullable = false, name = "\"value\"")
    private Double value;

    @Builder.Default
    private Double minOrderAmount = 0.0;

    private LocalDateTime expiresAt;

    private Integer maxUsages;

    @Builder.Default
    private Integer currentUsages = 0;

    @Builder.Default
    private boolean active = true;
}
