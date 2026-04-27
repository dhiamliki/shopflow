package com.shopflow.controllers;

import com.shopflow.dto.order.OrderResponse;
import com.shopflow.entities.OrderStatus;
import com.shopflow.security.JwtAuthenticationFilter;
import com.shopflow.services.OrderService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = OrderController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                UserDetailsServiceAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private OrderResponse sampleOrder() {
        return new OrderResponse(
                1L,
                "ORD-2026-00001",
                OrderStatus.PENDING,
                120.0,
                0.0,
                12.0,
                132.0,
                132.0,
                1L,
                "Tunis Center",
                null,
                false,
                0.0,
                true,
                null,
                null,
                List.of()
        );
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void checkoutShouldReturnOk() throws Exception {
        when(orderService.placeOrder(1L)).thenReturn(sampleOrder());

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "addressId": 1
                                }
                                """))
                .andExpect(status().isCreated());

        verify(orderService).placeOrder(1L);
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void checkoutShouldReturnBadRequestWhenAddressIsBlank() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "addressId": null
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void myOrdersShouldReturnOk() throws Exception {
        when(orderService.getMyOrders()).thenReturn(List.of(sampleOrder()));

        mockMvc.perform(get("/api/orders/my"))
                .andExpect(status().isOk());

        verify(orderService).getMyOrders();
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void orderByIdShouldReturnOk() throws Exception {
        when(orderService.getOrder(1L)).thenReturn(sampleOrder());

        mockMvc.perform(get("/api/orders/1"))
                .andExpect(status().isOk());

        verify(orderService).getOrder(1L);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateStatusShouldReturnOk() throws Exception {
        when(orderService.updateStatus(1L, OrderStatus.PAID)).thenReturn(sampleOrder());

        mockMvc.perform(put("/api/orders/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "PAID"
                                }
                                """))
                .andExpect(status().isOk());

        verify(orderService).updateStatus(1L, OrderStatus.PAID);
    }
}
