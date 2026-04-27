package com.shopflow.dto.address;

public record AddressResponse(
        Long id,
        String street,
        String city,
        String postalCode,
        String country,
        boolean principal
) {
}
