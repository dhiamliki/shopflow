export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: number;
  attributeName: string;
  attributeValue: string;
  priceDelta: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  promoPrice: number | null;
  effectivePrice: number;
  stock: number;
  salesCount: number;
  categories: string[];
  sellerName: string;
  imageUrls: string[];
  variants: ProductVariant[];
  averageRating: number;
  reviews: Review[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  children: Category[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ProductFilters {
  search?: string | null;
  categoryId?: number | null;
  sellerId?: number | null;
  promo?: boolean | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: string | null;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  variantId: number | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  appliedCoupon: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalTtc: number;
}

export interface CartItemPayload {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface Address {
  id: number;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  principal: boolean;
}

export interface AddressPayload {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  principal: boolean;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: number;
  productName: string;
  variantId: number | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalTtc: number;
  totalAmount: number;
  shippingAddressId: number;
  shippingAddress: string;
  appliedCouponCode: string | null;
  refunded: boolean;
  refundAmount: number;
  isNew: boolean;
  createdAt: string;
  statusUpdatedAt: string;
  items: OrderItem[];
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  categoryIds: number[];
  imageUrls: string[];
  variants: ProductVariantPayload[];
}

export interface ProductVariantPayload {
  attributeName: string;
  attributeValue: string;
  priceDelta: number | null;
  stock: number;
}
