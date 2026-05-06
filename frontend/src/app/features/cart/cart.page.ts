import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { Product, CartItem } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { SessionService } from '../../core/services/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    TndCurrencyPipe,
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
          <a routerLink="/login" [queryParams]="{ redirect: '/cart' }" class="button-primary px-8">
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
                <article class="grid grid-cols-[80px,minmax(0,1fr)] gap-4 border-b border-white/8 bg-white/[0.02] p-4 sm:grid-cols-[96px,minmax(0,1fr),132px,120px] sm:items-center lg:grid-cols-[104px,minmax(0,1fr),140px,124px] lg:p-5">
                  <a
                    [routerLink]="['/product', item.productId]"
                    class="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-white/8 bg-white/[0.03] sm:h-24 sm:w-24 lg:h-[104px] lg:w-[104px]"
                  >
                    <img class="h-full w-full object-cover" [src]="item.product.imageUrls[0]" [alt]="item.productName" />
                  </a>

                  <div class="min-w-0 space-y-3">
                    <div>
                      <p class="text-sm text-zinc-500">{{ item.product.sellerName }}</p>
                      <a [routerLink]="['/product', item.productId]" class="mt-1 line-clamp-2 block text-lg font-semibold leading-7 text-white lg:text-xl">
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
                  </div>

                  <div class="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto sm:block sm:space-y-3">
                    <p class="text-base font-semibold text-white">
                      {{ item.unitPrice | tndCurrency }}
                    </p>
                    <div class="inline-flex h-10 items-center rounded-md border border-white/10 bg-white/[0.03]">
                      <button type="button" class="h-10 px-3 text-zinc-300" (click)="updateQuantity(item, item.quantity - 1)">-</button>
                      <span class="min-w-10 px-2 text-center text-base font-semibold text-white">{{ item.quantity }}</span>
                      <button type="button" class="h-10 px-3 text-zinc-300" (click)="updateQuantity(item, item.quantity + 1)">+</button>
                    </div>
                  </div>

                  <div class="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto sm:block sm:space-y-3 sm:text-right">
                    <p class="text-base font-semibold text-white">
                      {{ item.totalPrice | tndCurrency }}
                    </p>
                    <button type="button" class="inline-flex items-center gap-2 text-zinc-300 hover:text-white" (click)="removeItem(item.id)">
                      <app-icon name="trash" [size]="16" className="text-zinc-300" />
                      Remove
                    </button>
                  </div>
                </article>
              }
            </div>
          </section>

          <aside class="space-y-5">
            <app-panel-card title="Order Summary" className="sticky top-28">
              <div class="space-y-5 text-lg">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Subtotal ({{ enrichedItems().length }} items)</span>
                  <span class="text-white">{{ cartService.cart().subtotal | tndCurrency }}</span>
                </div>
                @if (cartService.cart().discount > 0) {
                  <div class="flex items-center justify-between">
                    <span class="text-zinc-400">Discount</span>
                    <span class="text-emerald-300">-{{ cartService.cart().discount | tndCurrency }}</span>
                  </div>
                }
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Shipping</span>
                  <span class="text-emerald-300">
                    {{ cartService.cart().shippingFee === 0 ? 'Free' : (cartService.cart().shippingFee | tndCurrency) }}
                  </span>
                </div>
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="flex items-center justify-between">
                <span class="text-2xl font-semibold text-white">Total</span>
                <span class="text-4xl font-semibold tracking-tight text-white">
                  {{ cartService.cart().totalTtc | tndCurrency }}
                </span>
              </div>

              <a routerLink="/checkout" class="button-primary mt-6 w-full">
                <app-icon name="lock" [size]="18" className="text-black" />
                Proceed to Checkout
              </a>
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

  constructor() {
    this.cartService.loadCart().subscribe();
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

}
