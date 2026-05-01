import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon.component';

export type TopNavMode = 'marketing' | 'shop' | 'auth' | 'seller';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <header class="sticky top-0 z-50 border-b border-white/10 bg-black">
      <div class="mx-auto flex h-[78px] max-w-[1800px] items-center gap-5 px-6 lg:px-8">
        <a routerLink="/" class="flex shrink-0 items-center gap-3 text-white">
          <app-icon name="bag" [size]="28" [strokeWidth]="1.75" className="text-white" />
          <span class="text-[1.55rem] font-semibold tracking-[-0.03em]">shopflow</span>
        </a>

        @if (mode() !== 'seller') {
          <nav class="hidden flex-1 items-center justify-center gap-8 lg:flex xl:gap-10">
            @for (link of navLinks(); track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-white after:scale-x-100"
                [routerLinkActiveOptions]="{ exact: link.route === '/' }"
                class="relative text-sm font-medium text-white transition after:absolute after:-bottom-[1.8rem] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-white after:transition-transform hover:text-zinc-300"
              >
                {{ link.label }}
              </a>
            }
          </nav>
        }

        <div class="ml-auto flex min-w-0 items-center gap-3 lg:gap-4">
          @if (mode() === 'shop') {
            <form
              class="hidden min-w-[300px] max-w-[420px] flex-1 items-center gap-3 rounded-md border border-white/12 bg-white/[0.045] px-4 py-2.5 lg:flex"
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

          @if (showCommerceActions()) {
            <div class="hidden items-center gap-2 border-l border-white/10 pl-4 lg:flex">
              <a routerLink="/cart" class="icon-button has-badge">
                <app-icon name="shopping-cart" [size]="19" className="text-zinc-200" />
                @if (cartCount() > 0) {
                  <span class="badge-chip">{{ cartCount() }}</span>
                }
              </a>
            </div>
          }

          @if (session.isAuthenticated()) {
            <a
              [routerLink]="session.isSeller() ? '/seller/dashboard' : '/account/dashboard'"
              class="hidden items-center gap-3 rounded-md px-2 py-1.5 text-sm font-semibold text-white lg:flex"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white"
              >
                {{ session.initials() }}
              </span>
              <span class="leading-tight">
                <span class="block">{{ session.displayName() }}</span>
                @if (mode() === 'seller') {
                  <span class="text-xs font-medium text-zinc-400">Seller dashboard</span>
                }
              </span>
            </a>

            @if (mode() !== 'seller') {
              <button type="button" class="button-ghost hidden lg:inline-flex" (click)="logout()">
                Log out
              </button>
            }
          } @else {
            <div class="hidden items-center gap-3 lg:flex">
              <a routerLink="/login" class="min-h-0 border-0 bg-transparent px-2 text-sm font-medium text-white hover:bg-transparent">
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
  private readonly auth = inject(AuthService);

  searchQuery = '';

  readonly cartCount = computed(() => this.cartService.count());
  readonly showCommerceActions = computed(() => this.mode() === 'shop');
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
