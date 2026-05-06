package com.shopflow.dto.dashboard;

import java.util.List;

public record SellerDashboardResponse(
        SellerProfileResponse profile,
        long totalProducts,
        long totalOrders,
        double totalRevenue,
        long pendingOrders,
        long lowStockProducts,
        List<TopProductResponse> topProducts,
        List<RecentOrderResponse> recentOrders
) {
}
