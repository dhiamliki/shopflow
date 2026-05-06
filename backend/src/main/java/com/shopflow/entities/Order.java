package com.shopflow.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private User customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.PAY_ON_DELIVERY;

    @Builder.Default
    private Double subtotal = 0.0;

    @Builder.Default
    private Double discountAmount = 0.0;

    @Builder.Default
    private Double shippingFee = 0.0;

    @Builder.Default
    private Double totalTtc = 0.0;

    @Builder.Default
    private Double totalAmount = 0.0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipping_address_id")
    private Address shippingAddress;

    private String appliedCouponCode;

    @Builder.Default
    private boolean refunded = false;

    @Builder.Default
    private Double refundAmount = 0.0;

    @Builder.Default
    private boolean isNew = true;

    private LocalDateTime statusUpdatedAt;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (statusUpdatedAt == null) {
            statusUpdatedAt = createdAt;
        }
    }
}
