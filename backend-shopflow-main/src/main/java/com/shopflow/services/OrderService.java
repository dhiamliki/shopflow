package com.shopflow.services;

import com.shopflow.dto.order.OrderItemResponse;
import com.shopflow.dto.order.OrderResponse;
import com.shopflow.entities.*;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.mappers.CommerceMapper;
import com.shopflow.repositories.AddressRepository;
import com.shopflow.repositories.OrderRepository;
import com.shopflow.repositories.UserRepository;
import com.shopflow.utils.OrderNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final CartService cartService;
    private final CouponService couponService;
    private final ProductService productService;
    private final CommerceMapper commerceMapper;
    private final OrderNumberGenerator orderNumberGenerator;

    @Transactional
    public OrderResponse checkout(Long addressId) {
        User currentUser = currentUser();
        Cart cart = cartService.getUserCart();
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cannot checkout with an empty cart");
        }

        Address shippingAddress = addressRepository.findByIdAndUser(addressId, currentUser)
                .orElseThrow(() -> new BadRequestException("Shipping address not found for current user"));

        double subtotal = cart.getItems().stream()
                .mapToDouble(i -> productService.effectiveUnitPrice(i.getProduct(), i.getVariant()) * i.getQuantity())
                .sum();

        double discount = cartService.computeDiscount(cart, subtotal);
        double shippingFee = cartService.computeShippingFee(subtotal - discount);
        double total = subtotal - discount + shippingFee;

        Order order = Order.builder()
                .orderNumber(orderNumberGenerator.next())
                .customer(currentUser)
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .discountAmount(discount)
                .shippingFee(shippingFee)
                .totalTtc(total)
                .totalAmount(total)
                .shippingAddress(shippingAddress)
                .appliedCouponCode(cart.getCoupon() != null ? cart.getCoupon().getCode() : null)
                .isNew(true)
                .statusUpdatedAt(LocalDateTime.now())
                .build();

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            ProductVariant variant = cartItem.getVariant();

            int availableStock = variant != null ? variant.getStock() : product.getStock();
            if (cartItem.getQuantity() > availableStock) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            }

            if (variant != null) {
                variant.setStock(variant.getStock() - cartItem.getQuantity());
            } else {
                product.setStock(product.getStock() - cartItem.getQuantity());
            }
            product.setSalesCount(product.getSalesCount() + cartItem.getQuantity());

            double unitPrice = productService.effectiveUnitPrice(product, variant);
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .product(product)
                    .variant(variant)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(unitPrice * cartItem.getQuantity())
                    .build());
        }

        Order savedOrder = orderRepository.save(order);
        couponService.markCouponUsed(order.getAppliedCouponCode());
        cartService.clearCart(cart);

        return toResponse(savedOrder);
    }

    @Transactional
    public OrderResponse placeOrder(Long addressId) {
        return checkout(addressId);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> myOrders() {
        User currentUser = currentUser();
        return orderRepository.findByCustomerOrderByCreatedAtDesc(currentUser)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders() {
        return myOrders();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> allOrders() {
        return orderRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        ensureCanAccessOrder(order);
        if (order.isNew()) {
            order.setNew(false);
            orderRepository.save(order);
        }
        return toResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        User currentUser = currentUser();

        if (currentUser.getRole() == Role.SELLER && order.getItems().stream()
                .noneMatch(i -> i.getProduct().getSeller().getId().equals(currentUser.getId()))) {
            throw new BadRequestException("Seller cannot update this order");
        }

        if (!canTransition(order.getStatus(), status)) {
            throw new BadRequestException("Invalid order status transition");
        }
        order.setStatus(status);
        order.setStatusUpdatedAt(LocalDateTime.now());
        order.setNew(true);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));
        User currentUser = currentUser();

        if (currentUser.getRole() == Role.CUSTOMER && !order.getCustomer().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You cannot cancel this order");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PAID) {
            throw new BadRequestException("Only PENDING or PAID orders can be cancelled");
        }

        for (OrderItem item : order.getItems()) {
            if (item.getVariant() != null) {
                item.getVariant().setStock(item.getVariant().getStock() + item.getQuantity());
            } else {
                Product product = item.getProduct();
                product.setStock(product.getStock() + item.getQuantity());
            }
        }

        if (order.getStatus() == OrderStatus.PAID) {
            order.setRefunded(true);
            order.setRefundAmount(order.getTotalAmount());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setStatusUpdatedAt(LocalDateTime.now());
        order.setNew(true);
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(commerceMapper::toOrderItemResponse).toList();
        Address addr = order.getShippingAddress();
        String formattedAddress = addr.getStreet() + ", " + addr.getCity() + ", " + addr.getPostalCode() + ", " + addr.getCountry();
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStatus(),
                order.getSubtotal(),
                order.getDiscountAmount(),
                order.getShippingFee(),
                order.getTotalTtc(),
                order.getTotalAmount(),
                addr.getId(),
                formattedAddress,
                order.getAppliedCouponCode(),
                order.isRefunded(),
                order.getRefundAmount(),
                order.isNew(),
                order.getCreatedAt(),
                order.getStatusUpdatedAt(),
                items
        );
    }

    private void ensureCanAccessOrder(Order order) {
        User user = currentUser();
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        if (user.getRole() == Role.CUSTOMER && order.getCustomer().getId().equals(user.getId())) {
            return;
        }
        if (user.getRole() == Role.SELLER && order.getItems().stream()
                .anyMatch(i -> i.getProduct().getSeller().getId().equals(user.getId()))) {
            return;
        }
        throw new BadRequestException("You cannot access this order");
    }

    private boolean canTransition(OrderStatus current, OrderStatus next) {
        return switch (current) {
            case PENDING -> next == OrderStatus.PAID;
            case PAID -> next == OrderStatus.PROCESSING;
            case PROCESSING -> next == OrderStatus.SHIPPED;
            case SHIPPED -> next == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }
}
