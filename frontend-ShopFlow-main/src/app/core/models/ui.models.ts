import { Product } from './commerce.models';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string | number | null;
  exact?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export type NotificationType = 'order' | 'message' | 'offer' | 'system' | 'wishlist';

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  createdAtLabel: string;
  read: boolean;
  accent: 'green' | 'blue' | 'purple' | 'amber' | 'pink' | 'neutral';
  imageUrl?: string | null;
  actionLabel?: string | null;
}

export interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface ProfileDraft {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  bio: string;
}

export interface WishlistItem extends Product {
  vendorLabel?: string;
}
