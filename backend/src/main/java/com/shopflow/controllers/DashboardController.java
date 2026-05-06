package com.shopflow.controllers;

import com.shopflow.dto.dashboard.AdminDashboardResponse;
import com.shopflow.dto.dashboard.SellerDashboardResponse;
import com.shopflow.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> adminDashboard() {
        return ResponseEntity.ok(dashboardService.adminDashboard());
    }

    @GetMapping("/seller")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<SellerDashboardResponse> sellerDashboard() {
        return ResponseEntity.ok(dashboardService.sellerDashboard());
    }
}
