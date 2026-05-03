package com.shopflow.services;

import com.shopflow.dto.auth.AuthRequest;
import com.shopflow.dto.auth.AuthResponse;
import com.shopflow.dto.auth.RegistrationRequest;
import com.shopflow.entities.Role;
import com.shopflow.entities.User;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.mappers.UserMapper;
import com.shopflow.repositories.RefreshTokenRepository;
import com.shopflow.repositories.SellerProfileRepository;
import com.shopflow.repositories.UserRepository;
import com.shopflow.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private SellerProfileRepository sellerProfileRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserMapper userMapper;
    @Mock private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("customer@shopflow.com")
                .password("encoded")
                .firstName("Liam")
                .lastName("Customer")
                .role(Role.CUSTOMER)
                .active(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registerShouldThrowWhenEmailExists() {
        when(userRepository.existsByEmail("existing@shopflow.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new RegistrationRequest(
                "A", "B", "existing@shopflow.com", "Password123!", Role.CUSTOMER, null, null, null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void registerShouldRejectSellerWithoutShopName() {
        when(userRepository.existsByEmail("seller@shopflow.com")).thenReturn(false);

        assertThatThrownBy(() -> authService.register(new RegistrationRequest(
                "A", "B", "seller@shopflow.com", "Password123!", Role.SELLER, "   ", null, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("shop name");
    }

    @Test
    void loginShouldReturnTokensWhenCredentialsAreValid() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateToken(eq(user), any(Map.class))).thenReturn("access");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh");
        when(refreshTokenRepository.findAllByUserAndRevokedFalse(user)).thenReturn(List.of());
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toResponse(user)).thenReturn(new com.shopflow.dto.auth.UserResponse(1L, user.getEmail(), "Liam", "Customer", Role.CUSTOMER));

        AuthResponse response = authService.login(new AuthRequest(user.getEmail(), "Password123"));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.refreshToken()).isEqualTo("refresh");
    }

    @Test
    void updateToSellerShouldPersistTrimmedShopName() {
        SecurityContext context = mock(SecurityContext.class);
        SecurityContextHolder.setContext(context);
        when(context.getAuthentication()).thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenAnswer(invocation -> invocation.getArgument(0));
        when(sellerProfileRepository.findByUser(user)).thenReturn(Optional.empty());
        when(sellerProfileRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateToken(eq(user), any(Map.class))).thenReturn("access");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh");
        when(refreshTokenRepository.findAllByUserAndRevokedFalse(user)).thenReturn(List.of());
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toResponse(user)).thenReturn(new com.shopflow.dto.auth.UserResponse(1L, user.getEmail(), "Liam", "Customer", Role.SELLER));

        AuthResponse response = authService.updateToSeller(
                new com.shopflow.dto.auth.UpdateToSellerRequest("  Tunis Market  ", "  Local store  ", List.of("Fashion")));

        verify(sellerProfileRepository).save(argThat(profile ->
                profile.getShopName().equals("Tunis Market")
                        && "Local store".equals(profile.getDescription())
                        && profile.getUser().equals(user)));
        assertThat(user.getRole()).isEqualTo(Role.SELLER);
        assertThat(response.accessToken()).isEqualTo("access");
    }
}
