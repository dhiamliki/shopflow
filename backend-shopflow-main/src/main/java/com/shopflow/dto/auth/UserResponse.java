package com.shopflow.dto.auth;

import com.shopflow.entities.Role;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        Role role
) {
}
