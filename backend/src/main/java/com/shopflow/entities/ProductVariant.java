package com.shopflow.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        uniqueConstraints = @UniqueConstraint(
                name = "uk_product_variant_attribute_value",
                columnNames = {"product_id", "attribute_name", "attribute_value"}
        )
)
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private String attributeName;

    @Column(nullable = false)
    private String attributeValue;

    @Builder.Default
    private Double priceDelta = 0.0;

    @Builder.Default
    private Integer stock = 0;
}
