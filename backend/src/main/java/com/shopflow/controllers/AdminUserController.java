package com.shopflow.controllers;

import com.shopflow.dto.admin.AdminUserResponse;
import com.shopflow.dto.admin.UpdateUserActiveRequest;
import com.shopflow.services.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> listUsers() {
        return ResponseEntity.ok(adminUserService.listUsers());
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<AdminUserResponse> setActive(@PathVariable Long id,
                                                       @Valid @RequestBody UpdateUserActiveRequest request) {
        return ResponseEntity.ok(adminUserService.setActive(id, request.active()));
    }
}
