import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { OrderItem, Product } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { SessionService } from '../../core/services/session.service';
import { IconComponent } from '../../shared/components/icon.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

type EnrichedOrderItem = OrderItem & { product: Product };

@Component({
  selector: 'app-order-success-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, IconComponent, ProductCardComponent],
  template: `
    @if (order(); as o) {
      <section class="sf-page py-8">
        <div class="grid gap-12 xl:grid-cols-[1fr,540px]">
          <section class="space-y-9">
            <div class="space-y-5 text-center">
              <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10">
                <app-icon name="circle-check" [size]="36" className="text-emerald-300" />
              </div>
              <div class="space-y-2">
                <h1 class="font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  Thank you, {{ firstName() }}!
                </h1>
                <p class="text-2xl font-semibold tracking-tight text-emerald-300 sm:text-3xl">
                  Your order has been placed successfully.
                </p>
                <p class="text-lg text-zinc-400">
                  You can track the order from your account orders.
                </p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              @for (meta of orderMeta(); track meta.label) {
                <div class="panel-dark flex items-start gap-4 p-5">
                  <span class="mt-1 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                    <app-icon [name]="meta.icon" [size]="20" className="text-zinc-100" />
                  </span>
                  <div>
                    <p class="text-sm text-zinc-500">{{ meta.label }}</p>
                    <p class="mt-2 text-lg font-semibold text-white">{{ meta.value }}</p>
                    @if (meta.note) {
                      <p class="mt-1 text-sm text-zinc-400">{{ meta.note }}</p>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="space-y-5">
              <h2 class="text-xl font-semibold text-white">What happens next?</h2>
              <div class="grid gap-4 md:grid-cols-4">
                @for (step of steps; track step.title) {
                  <div class="panel-dark p-5">
                    <span class="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                      <app-icon [name]="step.icon" [size]="20" [className]="step.complete ? 'text-emerald-300' : 'text-zinc-300'" />
                    </span>
                    <p class="mt-5 text-base font-semibold" [ngClass]="step.complete ? 'text-emerald-300' : 'text-white'">{{ step.title }}</p>
                    <p class="mt-2 text-sm leading-7 text-zinc-400">{{ step.body }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="space-y-5">
              <div>
                <h2 class="text-xl font-semibold text-white">You might also like</h2>
              </div>

              <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                @for (item of recommendations(); track item.id) {
                  <app-product-card [product]="item" context="compact" [showSeller]="false" [showActions]="false" />
                }
              </div>
            </div>

            <div class="flex flex-wrap gap-4">
              <a routerLink="/browse" class="button-primary px-8">Continue Shopping</a>
              <a [routerLink]="['/account/orders', o.id]" class="button-secondary px-8">View Order Details</a>
            </div>
          </section>

          <aside class="space-y-5">
            <div class="panel-dark sticky top-28 p-6">
              <h2 class="text-xl font-semibold text-white">Order Summary</h2>
              <div class="mt-6 space-y-4">
                @for (item of enrichedItems(); track item.productId) {
                  <div class="flex items-center gap-4">
                    <img class="h-20 w-20 rounded-[18px] object-cover" [src]="item.product.imageUrls[0]" [alt]="item.productName" />
                    <div class="min-w-0 flex-1">
                      <p class="line-clamp-2 text-lg font-semibold text-white">{{ item.productName }}</p>
                      <p class="text-sm text-zinc-400">{{ item.variantLabel || 'Standard' }}</p>
                    </div>
                    <p class="text-xl font-semibold text-white">{{ item.totalPrice | currency: 'USD' : 'symbol' : '1.2-2' }}</p>
                  </div>
                }
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="space-y-4 text-base">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Subtotal</span>
                  <span class="text-white">{{ o.subtotal | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Shipping</span>
                  <span class="text-emerald-300">{{ o.shippingFee === 0 ? 'Free' : (o.shippingFee | currency: 'USD' : 'symbol' : '1.2-2') }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Discount</span>
                  <span class="text-white">{{ o.discountAmount | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                </div>
              </div>

              <div class="my-6 border-t border-white/8"></div>

              <div class="flex items-center justify-between">
                <span class="text-2xl font-semibold text-white">Total</span>
                <span class="text-4xl font-semibold tracking-tight text-white">
                  {{ o.totalAmount | currency: 'USD' : 'symbol' : '1.2-2' }}
                </span>
              </div>

              <div class="mt-6 space-y-5 text-sm">
                <div class="flex items-start gap-3">
                  <app-icon name="map-pin" [size]="16" className="mt-1 text-zinc-500" />
                  <p class="text-zinc-400">{{ o.shippingAddress }}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    }
  `
})
export class OrderSuccessPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orders = inject(OrdersService);
  private readonly catalog = inject(CatalogService);
  readonly session = inject(SessionService);

  readonly orderId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id') ?? 5001))),
    { initialValue: 5001 }
  );

  readonly order = toSignal(
    this.route.paramMap.pipe(
      map((params) => Number(params.get('id') ?? 0)),
      switchMap((orderId) => orderId ? this.orders.getOrder(orderId) : of(null))
    ),
    { initialValue: null }
  );

  readonly enrichedItems = toSignal(
    this.route.paramMap.pipe(
      map((params) => Number(params.get('id') ?? 5001)),
      switchMap((orderId) => this.orders.getOrder(orderId)),
      switchMap((order) =>
        !order || !order.items.length
          ? of([])
          : this.catalog.getProductsByIds(order.items.map((item) => item.productId)).pipe(
              map((products) =>
                order.items.map((item) => ({
                  ...item,
                  product: products.find((product) => product.id === item.productId) ?? products[0]
                }))
              )
            )
      )
    ),
    { initialValue: [] as EnrichedOrderItem[] }
  );

  readonly recommendations = toSignal(
    this.catalog.getTopSelling().pipe(map((products) => products.slice(0, 4))),
    { initialValue: [] }
  );

  readonly firstName = computed(() => this.session.user()?.firstName ?? 'Shopper');
  readonly orderMeta = computed(() => {
    const o = this.order();
    if (!o) return [];
    return [
      { label: 'Order Number', value: `#${o.orderNumber}`, note: '', icon: 'receipt' },
      {
        label: 'Order Date',
        value: new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        note: new Date(o.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        icon: 'calendar'
      },
      {
        label: 'Order Total',
        value: o.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        note: o.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        icon: 'card'
      }
    ];
  });

  readonly steps = [
    {
      icon: 'circle-check',
      title: 'Order Confirmed',
      body: 'We have received your order.',
      complete: true
    },
    {
      icon: 'package-open',
      title: 'Processing',
      body: 'We are preparing your items for shipment.',
      complete: false
    },
    {
      icon: 'truck',
      title: 'Shipped',
      body: 'Your order is on the way.',
      complete: false
    },
    {
      icon: 'home',
      title: 'Delivered',
      body: 'The delivery milestone appears after shipment is completed.',
      complete: false
    }
  ];
}
