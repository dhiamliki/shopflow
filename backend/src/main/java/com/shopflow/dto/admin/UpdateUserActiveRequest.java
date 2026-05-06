package com.shopflow.dto.admin;

import jakarta.validation.constraints.NotNull;

public record UpdateUserActiveRequest(
        @NotNull Boolean active
) {
}
