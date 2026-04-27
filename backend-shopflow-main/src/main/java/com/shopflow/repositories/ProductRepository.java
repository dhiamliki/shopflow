package com.shopflow.repositories;

import com.shopflow.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Page<Product> findBySeller_Email(String email, Pageable pageable);
    Optional<Product> findBySeller_EmailAndNameIgnoreCase(String sellerEmail, String name);

    @Query("""
            select distinct p
            from Product p
            left join p.categories c
            where p.active = true
              and (
                lower(p.name) like lower(concat('%', :query, '%'))
                or lower(p.description) like lower(concat('%', :query, '%'))
                or lower(c.name) like lower(concat('%', :query, '%'))
              )
            """)
    Page<Product> searchFullText(@Param("query") String query, Pageable pageable);

    long countBySeller_Id(Long sellerId);
    long countBySeller_IdAndStockLessThanEqual(Long sellerId, Integer threshold);
}
