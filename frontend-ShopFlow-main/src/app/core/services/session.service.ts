import { computed, effect, Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../config/api.config';
import { AuthResponse, ShopflowUser, StoredSession } from '../models/auth.models';

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly stored = readStoredSession();

  readonly accessToken = signal<string | null>(this.stored?.accessToken ?? null);
  readonly refreshToken = signal<string | null>(this.stored?.refreshToken ?? null);
  readonly user = signal<ShopflowUser | null>(this.stored?.user ?? null);

  readonly isAuthenticated = computed(() => Boolean(this.accessToken() && this.user()));
  readonly role = computed(() => this.user()?.role ?? null);
  readonly isCustomer = computed(() => this.role() === 'CUSTOMER');
  readonly isSeller = computed(() => this.role() === 'SELLER' || this.role() === 'ADMIN');
  readonly displayName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest';
  });
  readonly initials = computed(() => {
    const user = this.user();
    if (!user) {
      return 'SF';
    }

    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() || 'SF';
  });

  constructor() {
    effect(() => {
      const next: StoredSession = {
        accessToken: this.accessToken(),
        refreshToken: this.refreshToken(),
        user: this.user()
      };

      if (!next.accessToken || !next.user) {
        localStorage.removeItem(STORAGE_KEYS.session);
        return;
      }

      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(next));
    });
  }

  setSession(response: AuthResponse): void {
    this.accessToken.set(response.accessToken);
    this.refreshToken.set(response.refreshToken);
    this.user.set(response.user);
  }

  setAccessToken(token: string): void {
    this.accessToken.set(token);
  }

  patchUser(partial: Partial<ShopflowUser>): void {
    const user = this.user();
    if (!user) {
      return;
    }

    this.user.set({
      ...user,
      ...partial
    });
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
  }
}
