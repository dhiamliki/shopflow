package com.shopflow.services;

import com.shopflow.dto.auth.*;
import com.shopflow.entities.RefreshToken;
import com.shopflow.entities.Role;
import com.shopflow.entities.SellerProfile;
import com.shopflow.entities.User;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.mappers.UserMapper;
import com.shopflow.repositories.RefreshTokenRepository;
import com.shopflow.repositories.SellerProfileRepository;
import com.shopflow.repositories.UserRepository;
import com.shopflow.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthResponse register(RegistrationRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already exists");
        }

        Role role = request.role() != null ? request.role() : Role.CUSTOMER;
        if (role == Role.ADMIN) {
            throw new BadRequestException("ADMIN registration is not allowed");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .role(role)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        if (role == Role.SELLER) {
            sellerProfileRepository.save(SellerProfile.builder()
                    .user(savedUser)
                    .shopName(request.shopName() == null ? savedUser.getFirstName() + " Store" : request.shopName())
                    .description(request.shopDescription())
                    .logoUrl(request.shopLogoUrl())
                    .build());
        }

        return buildAuthResponse(savedUser);
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid refresh token");
        }

        User user = refreshToken.getUser();
        if (!jwtService.isTokenValid(refreshTokenValue, user)) {
            throw new BadRequestException("Invalid refresh token");
        }

        String accessToken = jwtService.generateToken(user, Map.of("role", user.getRole().name()));
        String newRefreshToken = jwtService.generateRefreshToken(user);

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        saveRefreshToken(user, newRefreshToken);

        return new AuthResponse(accessToken, newRefreshToken, userMapper.toResponse(user));
    }

    public void logout(String refreshTokenValue) {
        if (refreshTokenValue != null && !refreshTokenValue.isBlank()) {
            refreshTokenRepository.findByToken(refreshTokenValue).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        } else if (SecurityContextHolder.getContext().getAuthentication() != null) {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            userRepository.findByEmail(email).ifPresent(this::revokeActiveTokens);
        }
        SecurityContextHolder.clearContext();
    }

    private AuthResponse buildAuthResponse(User user) {
        revokeActiveTokens(user);
        String accessToken = jwtService.generateToken(user, Map.of("role", user.getRole().name()));
        String refreshToken = jwtService.generateRefreshToken(user);
        saveRefreshToken(user, refreshToken);
        return new AuthResponse(accessToken, refreshToken, userMapper.toResponse(user));
    }

    private void revokeActiveTokens(User user) {
        var activeTokens = refreshTokenRepository.findAllByUserAndRevokedFalse(user);
        if (activeTokens.isEmpty()) {
            return;
        }
        activeTokens.forEach(token -> token.setRevoked(true));
        refreshTokenRepository.saveAll(activeTokens);
    }

    private void saveRefreshToken(User user, String refreshTokenValue) {
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtService.getRefreshExpiration() / 1000))
                .revoked(false)
                .build());
    }
}
