package com.shopflow.repositories;

import com.shopflow.entities.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    Optional<ProductVariant> findByIdAndProduct_Id(Long id, Long productId);
}
