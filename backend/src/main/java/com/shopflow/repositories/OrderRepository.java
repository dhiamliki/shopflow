package com.shopflow.repositories;

import com.shopflow.entities.Order;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerOrderByCreatedAtDesc(User customer);
    List<Order> findTop10ByOrderByCreatedAtDesc();
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    long countByStatus(OrderStatus status);
    boolean existsByOrderNumber(String orderNumber);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where o.status <> 'CANCELLED'")
    Double sumTotalRevenue();
}
