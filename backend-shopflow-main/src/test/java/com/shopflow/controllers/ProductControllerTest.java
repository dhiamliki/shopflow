package com.shopflow.controllers;

import com.shopflow.dto.product.ProductFilterRequest;
import com.shopflow.dto.product.ProductRequest;
import com.shopflow.dto.product.ProductResponse;
import com.shopflow.security.JwtAuthenticationFilter;
import com.shopflow.services.ProductService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = ProductController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                UserDetailsServiceAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void productsShouldReturnOkAndBuildFilterRequest() throws Exception {
        when(productService.filterProducts(any())).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/products")
                        .param("search", "phone")
                        .param("categoryId", "2")
                        .param("minPrice", "10")
                        .param("maxPrice", "100")
                        .param("page", "1")
                        .param("size", "20"))
                .andExpect(status().isOk());

        ArgumentCaptor<ProductFilterRequest> captor = ArgumentCaptor.forClass(ProductFilterRequest.class);
        verify(productService).filterProducts(captor.capture());
        ProductFilterRequest request = captor.getValue();

        assertThat(request.search()).isEqualTo("phone");
        assertThat(request.categoryId()).isEqualTo(2L);
        assertThat(request.sellerId()).isNull();
        assertThat(request.promoOnly()).isNull();
        assertThat(request.minPrice()).isEqualTo(10.0);
        assertThat(request.maxPrice()).isEqualTo(100.0);
        assertThat(request.sortBy()).isEqualTo("newest");
        assertThat(request.sortDirection()).isEqualTo("desc");
        assertThat(request.page()).isEqualTo(1);
        assertThat(request.size()).isEqualTo(20);
    }

    @Test
    void byIdShouldReturnOk() throws Exception {
        when(productService.getById(1L))
                .thenReturn(new ProductResponse(1L, "Phone", "Desc", 100.0, null, 100.0, 5, 0L, List.of("Tech"), "Seller", List.of(), List.of(), 0.0, List.of()));

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk());

        verify(productService).getById(1L);
    }

    @Test
    void categoriesShouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "SELLER")
    void createShouldReturnOk() throws Exception {
        when(productService.createProduct(any()))
                .thenReturn(new ProductResponse(1L, "Phone", "Desc", 100.0, null, 100.0, 5, 0L, List.of("Tech"), "Seller", List.of(), List.of(), 0.0, List.of()));

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Phone",
                                  "description": "Good phone",
                                  "price": 100.0,
                                  "stock": 5,
                                  "categoryIds": [1]
                                }
                                """))
                .andExpect(status().isCreated());

        verify(productService).createProduct(any(ProductRequest.class));
    }

    @Test
    @WithMockUser(roles = "SELLER")
    void createShouldReturnBadRequestForInvalidPayload() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "description": "Good phone",
                                  "price": 100.0,
                                  "stock": 5,
                                  "categoryIds": [1]
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

}
