import { computed, Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../config/api.config';
import { Product } from '../models/commerce.models';
import {
  NotificationItem,
  NotificationPreference,
  ProfileDraft,
  WishlistItem
} from '../models/ui.models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  readonly wishlistAvailable = true;
  readonly notificationsAvailable = true;
  readonly profileEditingAvailable = true;
  readonly notificationPreferencesAvailable = true;

  readonly wishlist = signal<WishlistItem[]>(readStored(STORAGE_KEYS.wishlist, []));
  readonly notifications = signal<NotificationItem[]>(
    readStored(STORAGE_KEYS.notifications, [])
  );
  readonly notificationPreferences = signal<NotificationPreference[]>(
    readStored(STORAGE_KEYS.notificationPreferences, DEFAULT_PREFERENCES)
  );
  private readonly savedProfile = signal<ProfileDraft | null>(readStored(STORAGE_KEYS.profileDraft, null));
  readonly profileDraft = computed<ProfileDraft>(() => {
    const user = this.session.user();
    const saved = this.savedProfile();
    return {
      firstName: saved?.firstName ?? user?.firstName ?? '',
      lastName: saved?.lastName ?? user?.lastName ?? '',
      email: saved?.email ?? user?.email ?? '',
      phoneNumber: saved?.phoneNumber ?? '',
      dateOfBirth: saved?.dateOfBirth ?? '',
      gender: saved?.gender ?? 'Prefer not to say',
      bio: saved?.bio ?? ''
    };
  });

  readonly unreadNotificationCount = computed(() =>
    this.notifications().filter((notification) => !notification.read).length
  );

  constructor(private readonly session: SessionService) {}

  isInWishlist(productId: number): boolean {
    return this.wishlist().some((item) => item.id === productId);
  }

  toggleWishlist(product: Product): void {
    if (this.isInWishlist(product.id)) {
      this.removeWishlistItem(product.id);
      return;
    }

    this.wishlist.update((items) => [{ ...product, vendorLabel: product.sellerName }, ...items]);
    this.persistWishlist();
  }

  removeWishlistItem(productId: number): void {
    this.wishlist.update((items) => items.filter((item) => item.id !== productId));
    this.persistWishlist();
  }

  markAllNotificationsRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
    this.persistNotifications();
  }

  markNotificationRead(notificationId: number): void {
    this.notifications.update((items) =>
      items.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    );
    this.persistNotifications();
  }

  toggleNotificationPreference(preferenceKey: string): void {
    this.notificationPreferences.update((preferences) =>
      preferences.map((preference) =>
        preference.key === preferenceKey ? { ...preference, enabled: !preference.enabled } : preference
      )
    );
    localStorage.setItem(STORAGE_KEYS.notificationPreferences, JSON.stringify(this.notificationPreferences()));
  }

  saveProfile(draft: ProfileDraft): void {
    this.savedProfile.set(draft);
    this.session.patchUser({
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email
    });
    localStorage.setItem(STORAGE_KEYS.profileDraft, JSON.stringify(draft));
  }

  private persistWishlist(): void {
    localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(this.wishlist()));
  }

  private persistNotifications(): void {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(this.notifications()));
  }
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { key: 'orders', label: 'Orders & Deliveries', description: 'Get updates about your orders', icon: 'shopping-cart', enabled: true },
  { key: 'messages', label: 'Messages', description: 'New messages from buyers & sellers', icon: 'message', enabled: true },
  { key: 'offers', label: 'Offers & Promotions', description: 'Discounts, offers and deals', icon: 'tag', enabled: true },
  { key: 'wishlist', label: 'Wishlist & Alerts', description: 'Price drops and back in stock', icon: 'heart', enabled: true },
  { key: 'security', label: 'Account & Security', description: 'Important account updates', icon: 'lock', enabled: true },
  { key: 'system', label: 'System Updates', description: 'New features and improvements', icon: 'package-check', enabled: false }
];
