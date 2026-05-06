package com.shopflow.services;

import com.shopflow.dto.account.*;
import com.shopflow.dto.common.MessageResponse;
import com.shopflow.entities.Role;
import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.repositories.SellerProfileRepository;
import com.shopflow.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public AccountProfileResponse getProfile() {
        User user = currentUser();
        return toAccountProfile(user);
    }

    public AccountProfileResponse updateProfile(UpdateAccountProfileRequest request) {
        User user = currentUser();

        String firstName = request.firstName() == null ? "" : request.firstName().trim();
        String lastName = request.lastName() == null ? "" : request.lastName().trim();
        String email = request.email() == null ? "" : request.email().trim().toLowerCase();

        if (firstName.isBlank()) {
            throw new BadRequestException("First name is required");
        }
        if (lastName.isBlank()) {
            throw new BadRequestException("Last name is required");
        }
        if (email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (!email.equalsIgnoreCase(user.getEmail())) {
            throw new BadRequestException("Email updates are not supported yet");
        }

        user.setFirstName(firstName);
        user.setLastName(lastName);
        User updated = userRepository.save(user);
        return toAccountProfile(updated);
    }

    public MessageResponse changePassword(ChangePasswordRequest request) {
        User user = currentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        String newPassword = request.newPassword() == null ? "" : request.newPassword().trim();
        if (newPassword.length() < 8) {
            throw new BadRequestException("New password must contain at least 8 characters");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return new MessageResponse("Password updated successfully");
    }

    @Transactional(readOnly = true)
    public SellerSettingsResponse getSellerSettings() {
        User user = currentUser();
        ensureSeller(user);
        return toSellerSettingsResponse(user, sellerProfileRepository.findByUser(user).orElse(null));
    }

    public SellerSettingsResponse updateSellerSettings(UpdateSellerSettingsRequest request) {
        User user = currentUser();
        ensureSeller(user);

        String shopName = request.shopName() == null ? "" : request.shopName().trim();
        if (shopName.isBlank()) {
            throw new BadRequestException("Shop name is required");
        }

        String description = request.description() == null ? null : request.description().trim();
        if (description != null && description.isBlank()) {
            description = null;
        }

        String logoUrl = request.logoUrl() == null ? null : request.logoUrl().trim();
        if (logoUrl != null && logoUrl.isBlank()) {
            logoUrl = null;
        }

        SellerProfile profile = sellerProfileRepository.findByUser(user)
                .orElseGet(() -> SellerProfile.builder()
                        .user(user)
                        .rating(0.0)
                        .build());

        profile.setShopName(shopName);
        profile.setDescription(description);
        profile.setLogoUrl(logoUrl);

        SellerProfile saved = sellerProfileRepository.save(profile);
        return toSellerSettingsResponse(user, saved);
    }

    private AccountProfileResponse toAccountProfile(User user) {
        return new AccountProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getCreatedAt()
        );
    }

    private SellerSettingsResponse toSellerSettingsResponse(User seller, SellerProfile profile) {
        String sellerName = (seller.getFirstName() + " " + seller.getLastName()).trim();
        return new SellerSettingsResponse(
                seller.getId(),
                sellerName,
                seller.getEmail(),
                profile != null && profile.getShopName() != null ? profile.getShopName() : sellerName,
                profile != null ? profile.getDescription() : null,
                profile != null ? profile.getLogoUrl() : null,
                profile != null && profile.getRating() != null ? profile.getRating() : 0.0
        );
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void ensureSeller(User user) {
        if (user.getRole() != Role.SELLER && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("Seller account required");
        }
    }
}
