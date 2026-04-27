package com.shopflow.services;

import com.shopflow.dto.dashboard.*;
import com.shopflow.entities.Order;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.User;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.OrderItemRepository;
import com.shopflow.repositories.OrderRepository;
import com.shopflow.repositories.ProductRepository;
import com.shopflow.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse adminDashboard() {
        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        double totalRevenue = defaultZero(orderRepository.sumTotalRevenue());

        List<TopProductResponse> topProducts = orderItemRepository.findTopProductsStats(PageRequest.of(0, 10)).stream()
                .map(row -> new TopProductResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        ((Number) row[3]).doubleValue()
                ))
                .toList();

        List<TopSellerResponse> topSellers = orderItemRepository.findTopSellersStats(PageRequest.of(0, 10)).stream()
                .map(row -> new TopSellerResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).doubleValue()
                ))
                .toList();

        List<RecentOrderResponse> recentOrders = orderRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::toRecentOrder)
                .toList();

        return new AdminDashboardResponse(
                totalUsers,
                totalOrders,
                totalProducts,
                totalRevenue,
                pendingOrders,
                topProducts,
                topSellers,
                recentOrders
        );
    }

    @Transactional(readOnly = true)
    public SellerDashboardResponse sellerDashboard() {
        User seller = currentUser();
        long totalProducts = productRepository.countBySeller_Id(seller.getId());
        long totalOrders = defaultZero(orderItemRepository.countOrdersBySellerId(seller.getId()));
        double totalRevenue = defaultZero(orderItemRepository.sumRevenueBySellerId(seller.getId()));
        long pendingOrders = defaultZero(orderItemRepository.countPendingOrdersBySellerId(seller.getId()));
        long lowStockProducts = productRepository.countBySeller_IdAndStockLessThanEqual(seller.getId(), 5);

        return new SellerDashboardResponse(
                totalProducts,
                totalOrders,
                totalRevenue,
                pendingOrders,
                lowStockProducts
        );
    }

    private RecentOrderResponse toRecentOrder(Order order) {
        return new RecentOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCreatedAt()
        );
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Double defaultZero(Double value) {
        return value == null ? 0.0 : value;
    }

    private Long defaultZero(Long value) {
        return value == null ? 0L : value;
    }
}
