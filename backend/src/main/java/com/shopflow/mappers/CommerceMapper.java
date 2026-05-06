package com.shopflow.mappers;

import com.shopflow.dto.cart.CartItemResponse;
import com.shopflow.dto.order.OrderItemResponse;
import com.shopflow.entities.CartItem;
import com.shopflow.entities.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommerceMapper {

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "variantId", expression = "java(item.getVariant() != null ? item.getVariant().getId() : null)")
    @Mapping(target = "variantLabel", expression = "java(item.getVariant() != null ? item.getVariant().getAttributeName() + \": \" + item.getVariant().getAttributeValue() : null)")
    @Mapping(target = "unitPrice", expression = "java(resolveCartItemUnitPrice(item))")
    @Mapping(target = "totalPrice", expression = "java(resolveCartItemUnitPrice(item) * item.getQuantity())")
    CartItemResponse toCartItemResponse(CartItem item);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "variantId", expression = "java(item.getVariant() != null ? item.getVariant().getId() : null)")
    @Mapping(target = "variantLabel", expression = "java(item.getVariant() != null ? item.getVariant().getAttributeName() + \": \" + item.getVariant().getAttributeValue() : null)")
    OrderItemResponse toOrderItemResponse(OrderItem item);

    default double resolveCartItemUnitPrice(CartItem item) {
        double base = item.getProduct().getPromoPrice() != null
                && item.getProduct().getPromoPrice() < item.getProduct().getPrice()
                ? item.getProduct().getPromoPrice()
                : item.getProduct().getPrice();
        if (item.getVariant() != null && item.getVariant().getPriceDelta() != null) {
            base += item.getVariant().getPriceDelta();
        }
        return base;
    }
}
