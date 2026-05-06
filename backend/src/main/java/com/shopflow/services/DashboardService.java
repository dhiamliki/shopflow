package com.shopflow.services;

import com.shopflow.dto.dashboard.*;
import com.shopflow.entities.Order;
import com.shopflow.entities.OrderStatus;
import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.OrderItemRepository;
import com.shopflow.repositories.OrderRepository;
import com.shopflow.repositories.ProductRepository;
import com.shopflow.repositories.SellerProfileRepository;
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
    private final SellerProfileRepository sellerProfileRepository;

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
        long totalProducts = productRepository.countBySeller_IdAndActiveTrue(seller.getId());
        long totalOrders = defaultZero(orderItemRepository.countOrdersBySellerId(seller.getId()));
        double totalRevenue = defaultZero(orderItemRepository.sumRevenueBySellerId(seller.getId()));
        long pendingOrders = defaultZero(orderItemRepository.countPendingOrdersBySellerId(seller.getId()));
        long lowStockProducts = productRepository.countBySeller_IdAndActiveTrueAndStockLessThanEqual(seller.getId(), 5);
        SellerProfileResponse profile = toSellerProfileResponse(seller);

        List<TopProductResponse> topProducts = orderItemRepository
                .findTopProductsStatsBySellerId(seller.getId(), PageRequest.of(0, 5))
                .stream()
                .map(row -> new TopProductResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        ((Number) row[3]).doubleValue()
                ))
                .toList();

        List<RecentOrderResponse> recentOrders = orderItemRepository
                .findRecentOrdersBySellerId(seller.getId(), PageRequest.of(0, 5))
                .stream()
                .map(row -> new RecentOrderResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        (OrderStatus) row[2],
                        ((Number) row[3]).doubleValue(),
                        (java.time.LocalDateTime) row[4]
                ))
                .toList();

        return new SellerDashboardResponse(
                profile,
                totalProducts,
                totalOrders,
                totalRevenue,
                pendingOrders,
                lowStockProducts,
                topProducts,
                recentOrders
        );
    }

    private SellerProfileResponse toSellerProfileResponse(User seller) {
        SellerProfile profile = sellerProfileRepository.findByUser(seller).orElse(null);
        String sellerName = seller.getFirstName() + " " + seller.getLastName();

        if (profile == null) {
            return new SellerProfileResponse(
                    seller.getId(),
                    sellerName,
                    sellerName,
                    "",
                    null,
                    0.0
            );
        }

        return new SellerProfileResponse(
                seller.getId(),
                sellerName,
                profile.getShopName(),
                profile.getDescription(),
                profile.getLogoUrl(),
                profile.getRating()
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
