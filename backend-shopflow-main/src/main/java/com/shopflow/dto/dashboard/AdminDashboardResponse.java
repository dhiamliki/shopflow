package com.shopflow.dto.dashboard;

import java.util.List;

public record AdminDashboardResponse(
        long totalUsers,
        long totalOrders,
        long totalProducts,
        double totalRevenue,
        long pendingOrders,
        List<TopProductResponse> topProducts,
        List<TopSellerResponse> topSellers,
        List<RecentOrderResponse> recentOrders
) {
}
