package com.shopflow.dto.auth;

public record ForgotPasswordResponse(
        String message,
        String token
) {
}
