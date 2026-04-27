import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { DestroyRef, Component, computed, inject, input } from '@angular/core';
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
  imports: [RouterLink, CurrencyPipe, DecimalPipe, NgClass, GlowSurfaceDirective, IconComponent],
  template: `
    <article
      appGlowSurface
      class="panel-dark group flex h-full flex-col overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5"
      [ngClass]="context() === 'compact' ? 'rounded-[24px] p-3' : ''"
    >
      <div class="relative overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.03]">
        <a [routerLink]="['/product', product().id]" class="block">
          @if (primaryImage()) {
            <img
              class="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              [src]="primaryImage()"
              [alt]="product().name"
            />
          } @else {
            <div class="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_58%),linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.01))]">
              <app-icon name="bag" [size]="28" className="text-zinc-500" />
            </div>
          }
        </a>

        @if (workspace.wishlistAvailable) {
          <button
            type="button"
            class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white backdrop-blur transition hover:border-white/20"
            (click)="toggleWishlist()"
          >
            <app-icon
              name="heart"
              [size]="17"
              [className]="wishlisted() ? 'text-rose-400' : 'text-white'"
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

      <div class="mt-4 flex flex-1 flex-col">
        @if (showCategory()) {
          <p class="text-sm text-zinc-500">{{ categoryLabel() }}</p>
        }

        <a
          [routerLink]="['/product', product().id]"
          class="mt-1 line-clamp-2 text-[1.12rem] font-semibold leading-7 text-white transition hover:text-zinc-200"
        >
          {{ product().name }}
        </a>

        @if (showSeller()) {
          <p class="mt-2 text-sm text-zinc-400">by {{ product().sellerName }}</p>
        }

        <div class="mt-3 flex items-center gap-2 text-sm">
          <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
          <span class="text-emerald-300">In stock</span>
          <span class="text-zinc-500">&bull;</span>
          <span class="text-zinc-400">{{ product().averageRating | number: '1.1-1' }} rated</span>
        </div>

        <div class="mt-4 flex items-end gap-3">
          <span class="text-3xl font-semibold tracking-tight text-white">
            {{ product().effectivePrice | currency: 'USD' : 'symbol' : '1.0-0' }}
          </span>
          @if (product().promoPrice) {
            <span class="text-base text-zinc-500 line-through">
              {{ product().price | currency: 'USD' : 'symbol' : '1.0-0' }}
            </span>
          }
        </div>

        @if (showActions()) {
          <div class="mt-5 grid grid-cols-[1fr_auto] gap-3">
            <button type="button" class="button-secondary" (click)="addToCart()">Add to Cart</button>
            <button
              type="button"
              class="button-ghost inline-flex items-center justify-center px-4"
              (click)="removeIfWishlist()"
            >
              <app-icon
                [name]="context() === 'wishlist' ? 'trash' : 'share'"
                [size]="16"
                className="text-zinc-300"
              />
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
