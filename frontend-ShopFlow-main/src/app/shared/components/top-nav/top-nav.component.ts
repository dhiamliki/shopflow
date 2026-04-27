import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SessionService } from '../../../core/services/session.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon.component';

export type TopNavMode = 'marketing' | 'shop' | 'auth' | 'seller';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <header class="sticky top-0 z-50 border-b border-white/8 bg-black/92 backdrop-blur-xl">
      <div class="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-4 lg:px-8">
        <a routerLink="/" class="flex shrink-0 items-center gap-3 text-white">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <app-icon name="bag" [size]="21" className="text-white" />
          </span>
          <span class="font-display text-[1.9rem] font-semibold tracking-tight">shopflow</span>
        </a>

        @if (mode() !== 'seller') {
          <nav class="hidden items-center gap-7 lg:flex xl:gap-10">
            @for (link of navLinks(); track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-white after:scale-x-100"
                [routerLinkActiveOptions]="{ exact: link.route === '/' }"
                class="relative text-[1rem] font-medium text-zinc-300 transition after:absolute after:-bottom-[1.15rem] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform hover:text-white"
              >
                {{ link.label }}
              </a>
            }
          </nav>
        }

        <div class="ml-auto flex min-w-0 items-center gap-3 lg:gap-4">
          @if (mode() === 'shop') {
            <form
              class="hidden min-w-[340px] max-w-[420px] flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 lg:flex"
              (ngSubmit)="submitSearch()"
            >
              <app-icon name="search" [size]="18" className="text-zinc-500" />
              <input
                [(ngModel)]="searchQuery"
                name="query"
                type="text"
                placeholder="Search for products..."
                class="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </form>
          }

          @if (mode() === 'seller') {
            <div class="hidden items-center gap-3 lg:flex">
              <button type="button" class="icon-button">
                <app-icon name="search" [size]="19" className="text-zinc-300" />
              </button>
              <button type="button" class="icon-button">
                <app-icon name="message" [size]="19" className="text-zinc-300" />
              </button>
              <button type="button" class="icon-button">
                <app-icon name="bell" [size]="19" className="text-zinc-300" />
              </button>
            </div>
          }

          @if (showCommerceActions()) {
            <div class="hidden items-center gap-2 lg:flex">
              <a routerLink="/cart" class="icon-button has-badge">
                <app-icon name="bag" [size]="19" className="text-zinc-200" />
                @if (cartCount() > 0) {
                  <span class="badge-chip">{{ cartCount() }}</span>
                }
              </a>
              @if (workspace.wishlistAvailable) {
                <a routerLink="/account/wishlist" class="icon-button">
                  <app-icon name="heart" [size]="19" className="text-zinc-200" />
                </a>
              }
              @if (workspace.notificationsAvailable) {
                <a routerLink="/account/notifications" class="icon-button has-badge">
                  <app-icon name="bell" [size]="19" className="text-zinc-200" />
                  @if (notificationCount() > 0) {
                    <span class="badge-chip">{{ notificationCount() }}</span>
                  }
                </a>
              }
            </div>
          }

          @if (session.isAuthenticated()) {
            <a
              [routerLink]="session.isSeller() ? '/seller/dashboard' : '/account/dashboard'"
              class="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white lg:flex"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/18 text-sm font-bold text-emerald-300"
              >
                {{ session.initials() }}
              </span>
              <span class="leading-tight">
                <span class="block">{{ session.displayName() }}</span>
                @if (mode() === 'seller') {
                  <span class="text-xs font-medium text-zinc-400">View Store</span>
                }
              </span>
              <app-icon name="chevron-down" [size]="18" className="text-zinc-500" />
            </a>

            @if (mode() !== 'seller') {
              <button type="button" class="button-ghost hidden lg:inline-flex" (click)="logout()">
                Log out
              </button>
            }
          } @else if (mode() !== 'auth') {
            <div class="hidden items-center gap-3 lg:flex">
              <a routerLink="/login" class="button-ghost px-6">
                Log in
              </a>
              <a routerLink="/register" class="button-primary px-6">
                Sign up
              </a>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class TopNavComponent {
  readonly mode = input<TopNavMode>('marketing');

  readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  readonly workspace = inject(WorkspaceService);
  private readonly auth = inject(AuthService);

  searchQuery = '';

  readonly cartCount = computed(() => this.cartService.count());
  readonly notificationCount = computed(() => this.workspace.unreadNotificationCount());
  readonly showCommerceActions = computed(() => this.mode() === 'shop' || this.mode() === 'seller');
  readonly navLinks = computed(() => [
    { label: 'Home', route: '/' },
    { label: 'Browse', route: '/browse' },
    { label: 'Categories', route: '/categories' },
    { label: 'Sell', route: '/sell' },
    { label: 'How It Works', route: '/how-it-works' },
    { label: 'About Us', route: '/about' }
  ]);

  constructor() {
    effect(() => {
      if (this.session.isCustomer()) {
        this.cartService.prefetch();
      }
    });
  }

  submitSearch(): void {
    const query = this.searchQuery.trim();
    void this.router.navigate(['/browse'], {
      queryParams: query ? { q: query } : {}
    });
  }

  logout(): void {
    this.auth.logoutAndForget();
  }
}
