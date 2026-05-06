package com.shopflow.controllers;

import com.shopflow.dto.account.*;
import com.shopflow.dto.common.MessageResponse;
import com.shopflow.services.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountProfileResponse> profile() {
        return ResponseEntity.ok(accountService.getProfile());
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountProfileResponse> updateProfile(@Valid @RequestBody UpdateAccountProfileRequest request) {
        return ResponseEntity.ok(accountService.updateProfile(request));
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(accountService.changePassword(request));
    }

    @GetMapping("/seller-settings")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<SellerSettingsResponse> sellerSettings() {
        return ResponseEntity.ok(accountService.getSellerSettings());
    }

    @PutMapping("/seller-settings")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<SellerSettingsResponse> updateSellerSettings(@Valid @RequestBody UpdateSellerSettingsRequest request) {
        return ResponseEntity.ok(accountService.updateSellerSettings(request));
    }
}
