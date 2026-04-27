package com.shopflow.services;

import com.shopflow.dto.cart.CartItemResponse;
import com.shopflow.dto.cart.CartResponse;
import com.shopflow.entities.*;
import com.shopflow.exceptions.BadRequestException;
import com.shopflow.exceptions.NotFoundException;
import com.shopflow.mappers.CommerceMapper;
import com.shopflow.repositories.CartRepository;
import com.shopflow.repositories.CouponRepository;
import com.shopflow.repositories.ProductRepository;
import com.shopflow.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final ProductService productService;
    private final CommerceMapper commerceMapper;

    @Transactional
    public CartResponse addToCart(Long productId, Long variantId, Integer quantity) {
        User user = currentUser();
        Cart cart = cartRepository.findByUser(user).orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        Product product = productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new NotFoundException("Product not found"));
        ProductVariant variant = resolveVariant(product, variantId);

        int availableStock = availableStock(product, variant);
        if (quantity > availableStock) {
            throw new BadRequestException("Requested quantity exceeds stock");
        }

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId) && sameVariant(i.getVariant(), variant))
                .findFirst()
                .orElse(null);

        if (item == null) {
            cart.getItems().add(CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .variant(variant)
                    .quantity(quantity)
                    .build());
        } else {
            int newQty = item.getQuantity() + quantity;
            if (newQty > availableStock) {
                throw new BadRequestException("Requested quantity exceeds stock");
            }
            item.setQuantity(newQty);
        }

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateItem(Long cartItemId, Integer quantity) {
        Cart cart = getUserCart();
        CartItem item = cart.getItems().stream().filter(i -> i.getId().equals(cartItemId))
                .findFirst().orElseThrow(() -> new NotFoundException("Cart item not found"));

        int availableStock = availableStock(item.getProduct(), item.getVariant());
        if (quantity > availableStock) {
            throw new BadRequestException("Requested quantity exceeds stock");
        }

        item.setQuantity(quantity);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(Long cartItemId) {
        Cart cart = getUserCart();
        cart.getItems().removeIf(item -> item.getId().equals(cartItemId));
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse applyCoupon(String code) {
        Cart cart = getUserCart();
        Coupon coupon = validateCoupon(code);
        double subtotal = cart.getItems().stream()
                .mapToDouble(i -> productService.effectiveUnitPrice(i.getProduct(), i.getVariant()) * i.getQuantity())
                .sum();
        ensureCouponIsUsable(coupon, subtotal);
        cart.setCoupon(coupon);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeCoupon() {
        Cart cart = getUserCart();
        cart.setCoupon(null);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional(readOnly = true)
    public CartResponse getCart() {
        return toResponse(getUserCart());
    }

    @Transactional
    public void clearCart(Cart cart) {
        cart.getItems().clear();
        cart.setCoupon(null);
        cartRepository.save(cart);
    }

    @Transactional
    public Cart getUserCart() {
        User user = currentUser();
        return cartRepository.findByUser(user).orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    public double computeDiscount(Cart cart, double subtotal) {
        Coupon coupon = cart.getCoupon();
        if (coupon == null) {
            return 0.0;
        }
        if (!coupon.isActive()) {
            return 0.0;
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            return 0.0;
        }
        if (coupon.getMaxUsages() != null && coupon.getCurrentUsages() >= coupon.getMaxUsages()) {
            return 0.0;
        }
        if (subtotal < coupon.getMinOrderAmount()) {
            return 0.0;
        }

        return switch (coupon.getType()) {
            case FIXED -> Math.min(coupon.getValue(), subtotal);
            case PERCENT -> subtotal * (coupon.getValue() / 100.0);
        };
    }

    public double computeShippingFee(double discountedSubtotal) {
        return discountedSubtotal >= 200.0 ? 0.0 : 12.0;
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream().map(commerceMapper::toCartItemResponse).toList();
        double subtotal = items.stream().mapToDouble(CartItemResponse::totalPrice).sum();
        double discount = computeDiscount(cart, subtotal);
        double shippingFee = computeShippingFee(subtotal - discount);
        return new CartResponse(
                cart.getId(),
                items,
                cart.getCoupon() != null ? cart.getCoupon().getCode() : null,
                subtotal,
                discount,
                shippingFee,
                subtotal - discount + shippingFee
        );
    }

    private Coupon validateCoupon(String code) {
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndActiveTrue(code)
                .orElseThrow(() -> new NotFoundException("Coupon not found or inactive"));
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Coupon has expired");
        }
        if (coupon.getMaxUsages() != null && coupon.getCurrentUsages() >= coupon.getMaxUsages()) {
            throw new BadRequestException("Coupon usage limit reached");
        }
        return coupon;
    }

    private void ensureCouponIsUsable(Coupon coupon, double subtotal) {
        if (!coupon.isActive()) {
            throw new BadRequestException("Coupon is inactive");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Coupon has expired");
        }
        if (coupon.getMaxUsages() != null && coupon.getCurrentUsages() >= coupon.getMaxUsages()) {
            throw new BadRequestException("Coupon usage limit reached");
        }
        if (subtotal < coupon.getMinOrderAmount()) {
            throw new BadRequestException("Coupon minimum order amount not reached");
        }
    }

    private ProductVariant resolveVariant(Product product, Long variantId) {
        if (variantId == null) {
            return null;
        }
        return productService.getVariantForProduct(product.getId(), variantId);
    }

    private int availableStock(Product product, ProductVariant variant) {
        if (variant != null) {
            return variant.getStock() == null ? 0 : variant.getStock();
        }
        return product.getStock() == null ? 0 : product.getStock();
    }

    private boolean sameVariant(ProductVariant left, ProductVariant right) {
        if (left == null && right == null) {
            return true;
        }
        if (left == null || right == null) {
            return false;
        }
        return left.getId().equals(right.getId());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
    }
}
