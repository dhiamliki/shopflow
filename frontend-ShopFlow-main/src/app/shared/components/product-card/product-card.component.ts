import { CurrencyPipe, NgClass } from '@angular/common';
import { Component, DestroyRef, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../../core/models/commerce.models';
import { CartService } from '../../../core/services/cart.service';
import { SessionService } from '../../../core/services/session.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { GlowSurfaceDirective } from '../../directives/glow-surface.directive';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, NgClass, GlowSurfaceDirective, IconComponent],
  template: `
    <article
      appGlowSurface
      class="panel-dark group relative flex h-full flex-col overflow-hidden p-3 transition-all duration-200 hover:border-white/20"
      [ngClass]="context() === 'compact' ? 'p-3' : ''"
    >
      @if (context() === 'wishlist') {
        <input
          type="checkbox"
          class="sf-check absolute left-5 top-5 z-10 h-4 w-4 rounded border-white/40 bg-transparent"
        />
      }

      <div class="sf-image-well relative overflow-hidden rounded-md">
        <a [routerLink]="['/product', product().id]" class="block">
          @if (primaryImage()) {
            <img
              class="aspect-[1.08/1] w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02]"
              [src]="primaryImage()"
              [alt]="product().name"
            />
          } @else {
            <div class="flex aspect-[1.08/1] items-center justify-center">
              <app-icon name="bag" [size]="28" className="text-zinc-500" />
            </div>
          }
        </a>

        @if (workspace.wishlistAvailable && showActions()) {
          <button
            type="button"
            class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            (click)="toggleWishlist()"
          >
            <app-icon
              name="heart"
              [size]="17"
              [className]="wishlisted() || context() === 'wishlist' ? 'text-rose-500 fill-rose-500' : 'text-white'"
            />
          </button>
        }

        @if (product().promoPrice) {
          <span
            class="absolute left-3 top-3 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300"
          >
            Sale
          </span>
        }
      </div>

      <div class="mt-4 flex flex-1 flex-col px-1">
        @if (showCategory() && !showActions()) {
          <p class="text-sm text-zinc-500">{{ categoryLabel() }}</p>
        }

        <a
          [routerLink]="['/product', product().id]"
          class="mt-1 line-clamp-2 text-base font-semibold leading-6 text-white transition hover:text-zinc-200"
        >
          {{ product().name }}
        </a>

        @if (showSeller()) {
          <p class="mt-2 text-sm text-zinc-400">by {{ product().sellerName }}</p>
        }

        @if (showActions()) {
          <div class="mt-3 flex items-center gap-2 text-sm">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-emerald-300">In stock</span>
          </div>
        }

        <div class="mt-auto flex items-end justify-between gap-3 pt-3">
          <span class="text-xl font-semibold tracking-tight text-white">
            {{ product().effectivePrice | currency: 'USD' : 'symbol' : '1.2-2' }}
          </span>
          @if (!showActions()) {
            <button type="button" class="text-zinc-200 hover:text-white" (click)="toggleWishlist()">
              <app-icon
                name="heart"
                [size]="20"
                [className]="wishlisted() ? 'text-rose-500 fill-rose-500' : 'text-zinc-200'"
              />
            </button>
          }
        </div>

        @if (showActions()) {
          <div class="mt-5 flex items-center gap-4">
            <button type="button" class="button-secondary min-h-10 flex-1 px-4 text-sm" (click)="addToCart()">
              <app-icon name="shopping-cart" [size]="16" className="text-zinc-200" />
              Add to Cart
            </button>
            <button
              type="button"
              class="inline-flex min-h-10 items-center gap-2 text-sm text-zinc-300 hover:text-white"
              (click)="removeIfWishlist()"
            >
              <app-icon
                [name]="context() === 'wishlist' ? 'trash' : 'share'"
                [size]="16"
                className="text-zinc-300"
              />
              {{ context() === 'wishlist' ? 'Remove' : 'Share' }}
            </button>
          </div>
        }
      </div>
    </article>
  `
})
export class ProductCardComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartService = inject(CartService);
  readonly workspace = inject(WorkspaceService);
  private readonly session = inject(SessionService);

  readonly product = input.required<Product>();
  readonly context = input<'grid' | 'compact' | 'wishlist'>('grid');
  readonly showSeller = input(true);
  readonly showCategory = input(true);
  readonly showActions = input(true);

  readonly primaryImage = computed(() => this.product().imageUrls[0] ?? '');
  readonly categoryLabel = computed(() => this.product().categories[0] ?? 'Featured');
  readonly wishlisted = computed(() => this.workspace.isInWishlist(this.product().id));

  addToCart(): void {
    if (!this.session.isCustomer()) {
      void this.router.navigate(['/login'], {
        queryParams: {
          redirect: '/cart'
        }
      });
      return;
    }

    const preferredVariant = this.product().variants[0];
    this.cartService
      .addItem({
        productId: this.product().id,
        variantId: preferredVariant?.id ?? null,
        quantity: 1
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  toggleWishlist(): void {
    this.workspace.toggleWishlist(this.product());
  }

  removeIfWishlist(): void {
    if (this.context() === 'wishlist') {
      this.workspace.removeWishlistItem(this.product().id);
      return;
    }

    this.toggleWishlist();
  }
}
