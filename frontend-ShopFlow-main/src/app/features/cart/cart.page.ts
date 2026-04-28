import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { Product, CartItem } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { SessionService } from '../../core/services/session.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    PanelCardComponent
  ],
  template: `
    <section class="sf-page py-10">
      @if (!session.isCustomer()) {
        <app-empty-state
          icon="bag"
          title="Your cart is ready when you are"
          message="Cart, checkout, and order history are available for buyer accounts. Sign in with a customer account to continue."
        >
          <a routerLink="/auth" [queryParams]="{ mode: 'login', redirect: '/cart' }" class="button-primary px-8">
            Sign in to shop
          </a>
        </app-empty-state>
      } @else if (!enrichedItems().length) {
        <app-empty-state
          icon="bag"
          title="Your cart is empty"
          message="Browse products, add a few favorites, and come back here when you are ready to check out."
        >
          <a routerLink="/browse" class="button-primary px-8">Continue shopping</a>
        </app-empty-state>
      } @else {
        <div class="grid gap-12 xl:grid-cols-[1fr,500px]">
          <section class="space-y-7">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="space-y-3">
                <h1 class="font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                  Your Cart
                </h1>
                <p class="text-lg text-zinc-400">Review your items and proceed to checkout.</p>
              </div>
              <a routerLink="/browse" class="inline-flex items-center gap-3 text-lg text-zinc-300 hover:text-white">
                <app-icon name="arrow-left" [size]="18" className="text-zinc-300" />
                Continue Shopping
              </a>
            </div>

            <div class="overflow-hidden rounded-[28px] border border-white/8">
              @for (item of enrichedItems(); track item.id) {
                <article class="grid gap-5 border-b border-white/8 bg-white/[0.02] p-5 sm:grid-cols-[auto,140px,1fr,140px,120px] sm:items-center lg:p-7">
                  <label class="flex items-center justify-center">
                    <input
                      type="checkbox"
                      class="h-5 w-5 accent-emerald-400"
                      [checked]="isSelected(item.id)"
                      (change)="toggleItem(item.id)"
                    />
                  </label>

                  <a
                    [routerLink]="['/product', item.productId]"
                    class="overflow-hidden rounded-[20px] border border-white/8 bg-white/[0.03]"
                  >
                    <img class="aspect-square w-full object-cover" [src]="item.product.imageUrls[0]" [alt]="item.productName" />
                  </a>

                  <div class="space-y-3">
                    <div>
                      <p class="text-sm text-zinc-500">{{ item.product.sellerName }}</p>
                      <a [routerLink]="['/product', item.productId]" class="mt-1 block text-[1.65rem] font-semibold leading-9 text-white">
                        {{ item.productName }}
                      </a>
                    </div>
                    <div class="flex flex-wrap items-center gap-3 text-sm">
                      <span class="inline-flex items-center gap-2 text-emerald-300">
                        <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                        In stock
                      </span>
                      @if (item.variantLabel) {
                        <span class="text-zinc-500">|</span>
                        <span class="text-zinc-400">{{ item.variantLabel }}</span>
                      }
                    </div>
                    <div class="flex flex-wrap gap-4 text-sm">
                  <button type="button" class="inline-flex items-center gap-2 text-zinc-300 hover:text-white" (click)="moveToWishlist(item)">
                        <app-icon name="heart" [size]="16" className="text-zinc-300" />
                        Move to Wishlist
                      </button>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <p class="text-base font-semibold text-white">
                      {{ item.unitPrice | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                    <div class="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <button type="button" class="px-4 py-3 text-zinc-300" (click)="updateQuantity(item, item.quantity - 1)">-</button>
                      <span class="px-5 py-3 text-lg font-semibold text-white">{{ item.quantity }}</span>
                      <button type="button" class="px-4 py-3 text-zinc-300" (click)="updateQuantity(item, item.quantity + 1)">+</button>
                    </div>
                  </div>

                  <div class="space-y-3 text-right">
                    <p class="text-base font-semibold text-white">
                      {{ item.totalPrice | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                    <button type="button" class="inline-flex items-center gap-2 text-zinc-300 hover:text-white" (click)="removeItem(item.id)">
                      <app-icon name="trash" [size]="16" className="text-zinc-300" />
                      Remove
                    </button>
                  </div>
                </article>
              }
            </div>

            <div class="panel-dark flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div class="flex items-center gap-4">
                <label class="inline-flex items-center gap-3 text-base text-white">
                  <input
                    type="checkbox"
                    class="h-5 w-5 accent-emerald-400"
                    [checked]="allSelected()"
                    (change)="toggleAll()"
                  />
                  Select All ({{ enrichedItems().length }})
                </label>
              </div>

              <div class="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
                <button type="button" class="inline-flex items-center gap-2 hover:text-white" (click)="removeSelected()">
                  <app-icon name="trash" [size]="16" className="text-zinc-300" />
                  Remove Selected
                </button>
                <button type="button" class="inline-flex items-center gap-2 hover:text-white" (click)="applyCoupon()">
                  <app-icon name="badge-percent" [size]="16" className="text-zinc-300" />
                  Apply Coupon
                </button>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-4">
              @for (trust of trustFeatures; track trust.title) {
                <div class="panel-dark flex items-start gap-4 p-5">
                  <span class="mt-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                    <app-icon [name]="trust.icon" [size]="19" className="text-zinc-100" />
                  </span>
                  <div>
                    <p class="text-xl font-semibold text-white">{{ trust.title }}</p>
                    <p class="mt-2 text-sm leading-6 text-zinc-400">{{ trust.body }}</p>
                  </div>
                </div>
              }
            </div>
          </section>

          <aside class="space-y-5">
            <app-panel-card title="Order Summary" className="sticky top-28">
              <div class="space-y-5 text-lg">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Subtotal ({{ selectedItems().length }} items)</span>
                  <span class="text-white">{{ summary().subtotal | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Shipping</span>
                  <span class="text-emerald-300">
                    {{ summary().shipping === 0 ? 'Free' : (summary().shipping | currency: 'USD' : 'symbol' : '1.2-2') }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Estimated Taxes</span>
                  <span class="text-white">{{ summary().taxes | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                </div>
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="flex items-center justify-between">
                <span class="text-2xl font-semibold text-white">Total</span>
                <span class="text-4xl font-semibold tracking-tight text-white">
                  {{ summary().total | currency: 'USD' : 'symbol' : '1.2-2' }}
                </span>
              </div>

              <a routerLink="/checkout" class="button-primary mt-6 w-full">
                <app-icon name="lock" [size]="18" className="text-black" />
                Proceed to Checkout
              </a>

              <button type="button" class="button-secondary mt-4 w-full" (click)="checkoutWithPayPal()">
                Buy with <span class="font-bold text-sky-400">PayPal</span>
              </button>

              <p class="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-400">
                <app-icon name="shield-check" [size]="16" className="text-zinc-400" />
                Secure checkout. Your data is safe.
              </p>

              <div class="mt-6 rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">We Accept</p>
                <div class="mt-4 flex flex-wrap gap-3">
                  @for (pill of paymentPills; track pill) {
                    <span class="rounded-2xl border border-white/8 bg-black/35 px-4 py-3 text-sm font-semibold text-white">
                      {{ pill }}
                    </span>
                  }
                </div>
              </div>
            </app-panel-card>
          </aside>
        </div>
      }
    </section>
  `
})
export class CartPageComponent {
  private readonly catalog = inject(CatalogService);
  readonly cartService = inject(CartService);
  readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly workspace = inject(WorkspaceService);

  readonly selectedIds = signal<number[]>([]);

  readonly enrichedItems = toSignal(
    toObservable(this.cartService.cart).pipe(
      switchMap((cart) => {
        if (!cart.items.length) {
          return of([] as Array<CartItem & { product: Product }>);
        }

        return this.catalog.getProductsByIds(cart.items.map((item) => item.productId)).pipe(
          map((products) =>
            cart.items.map((item) => ({
              ...item,
              product: products.find((product) => product.id === item.productId) ?? products[0]
            }))
          )
        );
      })
    ),
    {
      initialValue: []
    }
  );

  readonly selectedItems = computed(() =>
    this.enrichedItems().filter((item) => this.selectedIds().includes(item.id))
  );
  readonly allSelected = computed(
    () => this.enrichedItems().length > 0 && this.selectedIds().length === this.enrichedItems().length
  );
  readonly summary = computed(() => {
    const subtotal = this.selectedItems().reduce((total, item) => total + item.totalPrice, 0);
    const shipping = subtotal === 0 || subtotal >= 200 ? 0 : 12;
    const taxes = subtotal * 0.08;

    return {
      subtotal,
      shipping,
      taxes,
      total: subtotal + shipping + taxes
    };
  });

  readonly trustFeatures = [
    {
      icon: 'truck',
      title: 'Free Shipping',
      body: 'Free shipping on qualifying orders.'
    },
    {
      icon: 'arrow-left',
      title: 'Easy Returns',
      body: '30-day returns on eligible items.'
    },
    {
      icon: 'shield-check',
      title: 'Secure Payment',
      body: 'Your payment information is always protected.'
    }
  ];

  readonly paymentPills = ['VISA', 'Mastercard', 'AMEX', 'PayPal', 'Apple Pay', 'G Pay'];

  constructor() {
    this.cartService.loadCart().subscribe();

    effect(() => {
      this.selectedIds.set(this.cartService.cart().items.map((item) => item.id));
    });
  }

  toggleItem(itemId: number): void {
    this.selectedIds.update((ids) =>
      ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]
    );
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set([]);
      return;
    }

    this.selectedIds.set(this.enrichedItems().map((item) => item.id));
  }

  isSelected(itemId: number): boolean {
    return this.selectedIds().includes(itemId);
  }

  updateQuantity(item: CartItem, nextQuantity: number): void {
    if (nextQuantity <= 0) {
      this.removeItem(item.id);
      return;
    }

    this.cartService.updateItem(item.id, nextQuantity).subscribe();
  }

  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId).subscribe();
  }

  moveToWishlist(item: CartItem & { product: Product }): void {
    this.workspace.toggleWishlist(item.product);
    this.removeItem(item.id);
  }

  removeSelected(): void {
    for (const item of this.selectedItems()) {
      this.cartService.removeItem(item.id).subscribe();
    }
  }

  applyCoupon(): void {
    this.cartService.applyCoupon('WELCOME10').subscribe();
  }

  checkoutWithPayPal(): void {
    void this.router.navigateByUrl('/checkout?payment=paypal');
  }
}
