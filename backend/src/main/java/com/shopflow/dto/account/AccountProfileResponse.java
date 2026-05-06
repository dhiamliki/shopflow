package com.shopflow.dto.account;

import com.shopflow.entities.Role;

import java.time.LocalDateTime;

public record AccountProfileResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        Role role,
        LocalDateTime createdAt
) {
}
