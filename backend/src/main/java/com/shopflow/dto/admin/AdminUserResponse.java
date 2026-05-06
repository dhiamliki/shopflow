package com.shopflow.dto.admin;

import com.shopflow.entities.Role;

import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean active,
        LocalDateTime createdAt
) {
}
