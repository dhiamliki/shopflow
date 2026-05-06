import { UserRole } from './auth.models';

export interface AccountProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

export interface UpdateAccountProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface SellerSettings {
  sellerId: number;
  sellerName: string;
  email: string;
  shopName: string;
  description: string | null;
  logoUrl: string | null;
  rating: number;
}

export interface UpdateSellerSettingsPayload {
  shopName: string;
  description?: string | null;
  logoUrl?: string | null;
}
