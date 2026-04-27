package com.shopflow.repositories;

import com.shopflow.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct_IdAndApprovedTrueOrderByCreatedAtDesc(Long productId);
    boolean existsByProduct_Id(Long productId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.product.id = :productId and r.approved = true")
    Double averageApprovedRatingByProductId(@Param("productId") Long productId);
}
