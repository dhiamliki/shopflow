package com.shopflow.controllers;

import com.shopflow.dto.cart.CartResponse;
import com.shopflow.security.JwtAuthenticationFilter;
import com.shopflow.services.CartService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = CartController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                UserDetailsServiceAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "CUSTOMER")
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CartService cartService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private CartResponse sampleCart() {
        return new CartResponse(1L, List.of(), null, 100.0, 0.0, 12.0, 112.0);
    }

    @Test
    void getCartShouldReturnOk() throws Exception {
        when(cartService.getCart()).thenReturn(sampleCart());

        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isOk());

        verify(cartService).getCart();
    }

    @Test
    void addItemShouldReturnOk() throws Exception {
        when(cartService.addToCart(2L, null, 3)).thenReturn(sampleCart());

        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": 2,
                                  "quantity": 3
                                }
                                """))
                .andExpect(status().isOk());

        verify(cartService).addToCart(2L, null, 3);
    }

    @Test
    void addItemShouldReturnBadRequestForInvalidPayload() throws Exception {
        mockMvc.perform(post("/api/cart/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "productId": 2,
                                  "quantity": 0
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateItemShouldReturnOk() throws Exception {
        when(cartService.updateItem(9L, 2)).thenReturn(sampleCart());

        mockMvc.perform(put("/api/cart/items/9")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "quantity": 2
                                }
                                """))
                .andExpect(status().isOk());

        verify(cartService).updateItem(9L, 2);
    }

    @Test
    void removeItemShouldReturnOk() throws Exception {
        when(cartService.removeItem(7L)).thenReturn(sampleCart());

        mockMvc.perform(delete("/api/cart/items/7"))
                .andExpect(status().isOk());

        verify(cartService).removeItem(7L);
    }

    @Test
    void applyCouponShouldReturnOk() throws Exception {
        when(cartService.applyCoupon("WELCOME10")).thenReturn(sampleCart());

        mockMvc.perform(post("/api/cart/coupon")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "WELCOME10"
                                }
                                """))
                .andExpect(status().isOk());

        verify(cartService).applyCoupon("WELCOME10");
    }
}
