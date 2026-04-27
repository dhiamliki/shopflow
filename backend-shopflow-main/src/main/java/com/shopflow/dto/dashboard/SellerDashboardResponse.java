package com.shopflow.dto.dashboard;

public record SellerDashboardResponse(
        long totalProducts,
        long totalOrders,
        double totalRevenue,
        long pendingOrders,
        long lowStockProducts
) {
}
