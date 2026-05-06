package com.shopflow.controllers;

import com.shopflow.dto.coupon.CouponResponse;
import com.shopflow.entities.CouponType;
import com.shopflow.security.JwtAuthenticationFilter;
import com.shopflow.services.CouponService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = CouponAdminController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                UserDetailsServiceAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
class CouponAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CouponService couponService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    @WithMockUser(roles = "ADMIN")
    void createShouldReturnOk() throws Exception {
        CouponResponse created = new CouponResponse(
                1L, "WELCOME10", CouponType.PERCENT, 10.0, 100.0,
                LocalDateTime.now().plusDays(30), 100, 0, true
        );
        when(couponService.create("WELCOME10", CouponType.PERCENT, 10.0, 100.0, null, null)).thenReturn(created);

        mockMvc.perform(post("/api/coupons")
                        .contentType("application/json")
                        .content("""
                                {
                                  "code": "WELCOME10",
                                  "type": "PERCENT",
                                  "value": 10.0,
                                  "minOrderAmount": 100.0
                                }
                                """))
                .andExpect(status().isCreated());

        verify(couponService).create("WELCOME10", CouponType.PERCENT, 10.0, 100.0, null, null);
    }

    @Test
    void validateShouldReturnOk() throws Exception {
        CouponResponse validated = new CouponResponse(
                1L, "WELCOME10", CouponType.PERCENT, 10.0, 100.0,
                LocalDateTime.now().plusDays(30), 100, 0, true
        );

        when(couponService.validate("WELCOME10")).thenReturn(validated);

        mockMvc.perform(get("/api/coupons/validate/WELCOME10"))
                .andExpect(status().isOk());

        verify(couponService).validate("WELCOME10");
    }
}
