package com.shopflow.dto.product;

import com.shopflow.dto.review.ReviewResponse;

import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String description,
        Double price,
        Double promoPrice,
        Double effectivePrice,
        Integer stock,
        Long salesCount,
        List<String> categories,
        Long sellerId,
        String sellerName,
        List<String> imageUrls,
        List<ProductVariantResponse> variants,
        Double averageRating,
        List<ReviewResponse> reviews
) {
}
