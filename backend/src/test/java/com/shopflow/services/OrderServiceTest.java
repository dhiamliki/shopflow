package com.shopflow.services;

import com.shopflow.dto.order.OrderItemResponse;
import com.shopflow.dto.order.OrderResponse;
import com.shopflow.entities.*;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.mappers.CommerceMapper;
import com.shopflow.repositories.AddressRepository;
import com.shopflow.repositories.OrderRepository;
import com.shopflow.repositories.UserRepository;
import com.shopflow.utils.OrderNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private CartService cartService;
    @Mock private CouponService couponService;
    @Mock private ProductService productService;
    @Mock private CommerceMapper commerceMapper;
    @Mock private OrderNumberGenerator orderNumberGenerator;

    @InjectMocks private OrderService orderService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(3L).email("customer@shopflow.com").role(Role.CUSTOMER).firstName("Liam").lastName("Customer").build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void checkoutShouldFailForEmptyCart() {
        SecurityContext context = mock(SecurityContext.class);
        SecurityContextHolder.setContext(context);
        when(context.getAuthentication()).thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(cartService.getUserCart()).thenReturn(Cart.builder().user(user).items(List.of()).build());

        assertThatThrownBy(() -> orderService.checkout(1L, PaymentMethod.PAY_ON_DELIVERY))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("empty cart");
    }

    @Test
    void checkoutShouldCreateOrderAndClearCart() {
        SecurityContext context = mock(SecurityContext.class);
        SecurityContextHolder.setContext(context);
        when(context.getAuthentication()).thenReturn(new UsernamePasswordAuthenticationToken(user.getEmail(), null));

        Product product = Product.builder().id(1L).name("Headphones").price(100.0).stock(5).salesCount(0L).build();
        CartItem item = CartItem.builder().product(product).quantity(2).build();
        Cart cart = Cart.builder().user(user).items(new java.util.ArrayList<>(List.of(item))).build();
        Address address = Address.builder().id(1L).user(user).street("A").city("B").postalCode("1000").country("TN").build();

        when(cartService.getUserCart()).thenReturn(cart);
        when(orderNumberGenerator.next()).thenReturn("ORD-2026-00001");
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(addressRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(address));
        when(productService.effectiveUnitPrice(product, null)).thenReturn(100.0);
        when(cartService.computeDiscount(cart, 200.0)).thenReturn(0.0);
        when(cartService.computeShippingFee(200.0)).thenReturn(0.0);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(commerceMapper.toOrderItemResponse(any(OrderItem.class)))
                .thenReturn(new OrderItemResponse(1L, "Headphones", null, null, 2, 100.0, 200.0));

        OrderResponse response = orderService.checkout(1L, PaymentMethod.PAY_ON_DELIVERY);

        verify(cartService).clearCart(cart);
        verify(couponService).markCouponUsed(null);
        assertThat(response.orderNumber()).isEqualTo("ORD-2026-00001");
        assertThat(response.paymentMethod()).isEqualTo(PaymentMethod.PAY_ON_DELIVERY);
        assertThat(response.totalAmount()).isEqualTo(200.0);
    }
}
