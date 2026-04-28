package com.shopflow.repositories;

import com.shopflow.entities.OrderItem;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.Product;
import com.shopflow.entities.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("select oi.product from OrderItem oi where oi.order.status <> 'CANCELLED' group by oi.product.id order by sum(oi.quantity) desc")
    List<Product> findTopSellingProducts(Pageable pageable);

    @Query("select coalesce(sum(oi.totalPrice), 0) from OrderItem oi where oi.product.seller.id = :sellerId and oi.order.status <> 'CANCELLED'")
    Double sumRevenueBySellerId(@Param("sellerId") Long sellerId);

    @Query("select count(distinct oi.order.id) from OrderItem oi where oi.product.seller.id = :sellerId and oi.order.status <> 'CANCELLED'")
    Long countOrdersBySellerId(@Param("sellerId") Long sellerId);

    @Query("""
            select oi.product.id, oi.product.name, sum(oi.quantity), coalesce(sum(oi.totalPrice),0)
            from OrderItem oi
            where oi.order.status <> 'CANCELLED'
            group by oi.product.id, oi.product.name
            order by sum(oi.quantity) desc
            """)
    List<Object[]> findTopProductsStats(Pageable pageable);

    @Query("""
            select oi.product.id, oi.product.name, sum(oi.quantity), coalesce(sum(oi.totalPrice),0)
            from OrderItem oi
            where oi.product.seller.id = :sellerId
              and oi.order.status <> 'CANCELLED'
            group by oi.product.id, oi.product.name
            order by sum(oi.quantity) desc
            """)
    List<Object[]> findTopProductsStatsBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("""
            select oi.order.id, oi.order.orderNumber, oi.order.status, coalesce(sum(oi.totalPrice),0), oi.order.createdAt
            from OrderItem oi
            where oi.product.seller.id = :sellerId
              and oi.order.status <> 'CANCELLED'
            group by oi.order.id, oi.order.orderNumber, oi.order.status, oi.order.createdAt
            order by oi.order.createdAt desc
            """)
    List<Object[]> findRecentOrdersBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("""
            select oi.product.seller.id, concat(oi.product.seller.firstName, ' ', oi.product.seller.lastName), coalesce(sum(oi.totalPrice),0)
            from OrderItem oi
            where oi.order.status <> 'CANCELLED'
            group by oi.product.seller.id, oi.product.seller.firstName, oi.product.seller.lastName
            order by coalesce(sum(oi.totalPrice),0) desc
            """)
    List<Object[]> findTopSellersStats(Pageable pageable);

    @Query("""
            select count(distinct oi.order.id)
            from OrderItem oi
            where oi.product.seller.id = :sellerId and oi.order.status = 'PENDING'
            """)
    Long countPendingOrdersBySellerId(@Param("sellerId") Long sellerId);

    @Query("""
            select (count(oi) > 0)
            from OrderItem oi
            where oi.order.customer = :customer
              and oi.product = :product
              and oi.order.status in :statuses
            """)
    boolean existsPurchasedProductByCustomer(
            @Param("customer") User customer,
            @Param("product") Product product,
            @Param("statuses") Collection<OrderStatus> statuses
    );
}
