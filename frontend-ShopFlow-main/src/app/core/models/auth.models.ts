export type UserRole = 'ADMIN' | 'SELLER' | 'CUSTOMER';

export interface ShopflowUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: ShopflowUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  shopName?: string | null;
  shopDescription?: string | null;
  shopLogoUrl?: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateToSellerRequest {
  shopName: string;
  shopDescription?: string | null;
  categories?: string[];
}

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: ShopflowUser | null;
}
