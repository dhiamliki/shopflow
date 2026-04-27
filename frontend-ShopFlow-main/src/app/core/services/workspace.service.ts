import { computed, Injectable, signal } from '@angular/core';
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
  readonly wishlistAvailable = false;
  readonly notificationsAvailable = false;
  readonly profileEditingAvailable = false;
  readonly notificationPreferencesAvailable = false;

  readonly wishlist = signal<WishlistItem[]>([]);
  readonly notifications = signal<NotificationItem[]>([]);
  readonly notificationPreferences = signal<NotificationPreference[]>([]);
  readonly profileDraft = computed<ProfileDraft>(() => {
    const user = this.session.user();
    return {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      bio: ''
    };
  });

  readonly unreadNotificationCount = computed(() => 0);

  constructor(private readonly session: SessionService) {}

  isInWishlist(productId: number): boolean {
    return this.wishlistAvailable && this.wishlist().some((item) => item.id === productId);
  }

  toggleWishlist(_product: Product): void {}

  removeWishlistItem(_productId: number): void {}

  markAllNotificationsRead(): void {}

  markNotificationRead(_notificationId: number): void {}

  toggleNotificationPreference(_preferenceKey: string): void {}

  saveProfile(_draft: ProfileDraft): void {}
}
