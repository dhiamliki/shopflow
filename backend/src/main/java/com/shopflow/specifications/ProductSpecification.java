package com.shopflow.specifications;

import com.shopflow.entities.Product;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;

public final class ProductSpecification {

    private ProductSpecification() {
    }

    public static Specification<Product> nameContains(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            query.distinct(true);
            var categoryJoin = root.join("categories", jakarta.persistence.criteria.JoinType.LEFT);
            String value = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), value),
                    cb.like(cb.lower(root.get("description")), value),
                    cb.like(cb.lower(categoryJoin.get("name")), value)
            );
        };
    }

    public static Specification<Product> categoryEquals(Long categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null) {
                return cb.conjunction();
            }
            query.distinct(true);
            return cb.equal(root.join("categories").get("id"), categoryId);
        };
    }

    public static Specification<Product> categoryIn(Collection<Long> categoryIds) {
        return (root, query, cb) -> {
            if (categoryIds == null || categoryIds.isEmpty()) {
                return cb.conjunction();
            }
            query.distinct(true);
            return root.join("categories").get("id").in(categoryIds);
        };
    }

    public static Specification<Product> sellerEquals(Long sellerId) {
        return (root, query, cb) -> sellerId == null
                ? cb.conjunction()
                : cb.equal(root.get("seller").get("id"), sellerId);
    }

    public static Specification<Product> promoOnly(Boolean promoOnly) {
        return (root, query, cb) -> (promoOnly == null || !promoOnly)
                ? cb.conjunction()
                : cb.and(
                cb.isNotNull(root.get("promoPrice")),
                cb.lessThan(root.get("promoPrice"), root.get("price"))
        );
    }

    public static Specification<Product> minPrice(Double minPrice) {
        return (root, query, cb) -> minPrice == null
                ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    public static Specification<Product> maxPrice(Double maxPrice) {
        return (root, query, cb) -> maxPrice == null
                ? cb.conjunction()
                : cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }

    public static Specification<Product> activeOnly() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }
}
