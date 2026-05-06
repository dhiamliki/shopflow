package com.shopflow.services;

import com.shopflow.dto.store.PublicStoreResponse;
import com.shopflow.entities.Role;
import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.ProductRepository;
import com.shopflow.repositories.SellerProfileRepository;
import com.shopflow.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public PublicStoreResponse getPublicStore(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .filter(user -> user.getRole() == Role.SELLER && user.isActive())
                .orElseThrow(() -> new NotFoundException("Store not found"));

        SellerProfile profile = sellerProfileRepository.findByUser(seller).orElse(null);
        String sellerName = seller.getFirstName() + " " + seller.getLastName();

        return new PublicStoreResponse(
                seller.getId(),
                sellerName,
                profile != null && profile.getShopName() != null ? profile.getShopName() : sellerName,
                profile != null && profile.getDescription() != null ? profile.getDescription() : "",
                profile != null ? profile.getLogoUrl() : null,
                profile != null && profile.getRating() != null ? profile.getRating() : 0.0,
                productRepository.countBySeller_IdAndActiveTrue(seller.getId())
        );
    }
}
