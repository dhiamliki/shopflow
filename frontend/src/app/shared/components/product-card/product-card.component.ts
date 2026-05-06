import { NgClass } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../../core/models/commerce.models';
import { CartService } from '../../../core/services/cart.service';
import { SessionService } from '../../../core/services/session.service';
import { resolveProductImageUrl } from '../../../core/utils/image-url.util';
import { GlowSurfaceDirective } from '../../directives/glow-surface.directive';
import { TndCurrencyPipe } from '../../pipes/tnd-currency.pipe';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, TndCurrencyPipe, NgClass, GlowSurfaceDirective, IconComponent],
  template: `
    <article
      appGlowSurface
      class="panel-dark group relative flex h-full flex-col overflow-hidden p-3 transition-all duration-200 hover:border-white/20"
      [ngClass]="context() === 'compact' ? 'p-3' : ''"
    >
      <div
        class="sf-product-media-well relative aspect-square overflow-hidden rounded-md"
      >
        <a [routerLink]="['/product', product().id]" class="block h-full w-full">
          @if (primaryImage() && !imageFailed()) {
            <img
              class="sf-product-card-image h-full w-full"
              [src]="primaryImage()"
              [alt]="product().name"
              loading="lazy"
              (error)="onImageError()"
            />
          } @else {
            <div class="flex h-full items-center justify-center bg-zinc-900/85">
              <app-icon name="bag" [size]="28" className="text-zinc-500" />
            </div>
          }
        </a>

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

        @if (showActions() || context() === 'grid') {
          <div class="mt-3 flex items-center gap-2 text-sm">
            <span class="h-1.5 w-1.5 rounded-full" [ngClass]="isInStock() ? 'bg-emerald-400' : 'bg-rose-400'"></span>
            <span [ngClass]="isInStock() ? 'text-emerald-300' : 'text-rose-300'">
              {{ isInStock() ? 'In stock' : 'Out of stock' }}
            </span>
          </div>
        }

        <div class="mt-auto flex items-end justify-between gap-3 pt-3">
          <span class="text-xl font-semibold tracking-tight text-white">
            {{ product().effectivePrice | tndCurrency }}
          </span>
        </div>

        @if (showActions()) {
          <div class="mt-5">
            <button
              type="button"
              class="button-secondary min-h-10 w-full px-4 text-sm"
              (click)="addToCart()"
            >
              <app-icon name="shopping-cart" [size]="16" className="text-zinc-200" />
              Add to Cart
            </button>
          </div>
        }
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartService = inject(CartService);
  private readonly session = inject(SessionService);

  readonly product = input.required<Product>();
  readonly context = input<'grid' | 'compact'>('grid');
  readonly showSeller = input(true);
  readonly showCategory = input(true);
  readonly showActions = input(true);

  readonly imageFailed = signal(false);
  readonly primaryImage = computed(() => resolveProductImageUrl(this.product().imageUrls[0] ?? ''));
  readonly availableStock = computed(() => {
    const product = this.product();
    if (!product.variants.length) {
      return product.stock;
    }
    const variantTotal = product.variants.reduce((total, variant) => total + Math.max(0, variant.stock), 0);
    return Math.max(product.stock, variantTotal);
  });
  readonly isInStock = computed(() => this.availableStock() > 0);
  readonly categoryLabel = computed(() => this.product().categories[0] ?? 'Featured');

  constructor() {
    effect(() => {
      this.product().id;
      this.imageFailed.set(false);
    });
  }

  onImageError(): void {
    this.imageFailed.set(true);
  }

  addToCart(): void {
    if (!this.session.isCustomer()) {
      void this.router.navigate(['/login'], {
        queryParams: {
          redirect: '/cart',
        },
      });
      return;
    }

    const preferredVariant =
      this.product().variants.find((variant) => variant.stock > 0) ?? this.product().variants[0];
    this.cartService
      .addItem({
        productId: this.product().id,
        variantId: preferredVariant?.id ?? null,
        quantity: 1,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
