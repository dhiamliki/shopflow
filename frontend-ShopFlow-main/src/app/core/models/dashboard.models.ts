import { OrderStatus } from './commerce.models';

export interface SellerProfileSummary {
  sellerId: number;
  sellerName: string;
  shopName: string;
  description: string;
  logoUrl: string | null;
  rating: number;
}

export interface SellerTopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface SellerRecentOrder {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}

export interface SellerDashboard {
  profile: SellerProfileSummary;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  topProducts: SellerTopProduct[];
  recentOrders: SellerRecentOrder[];
}
