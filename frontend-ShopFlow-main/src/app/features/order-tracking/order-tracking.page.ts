import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { OrderItem, Product } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';

type TrackingOrderItem = OrderItem & { product: Product };

@Component({
  selector: 'app-order-tracking-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink, IconComponent, PanelCardComponent],
  template: `
    @if (order(); as current) {
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-2">
          <p class="text-sm text-zinc-500">My Orders &rsaquo; {{ current.orderNumber }}</p>
          <h1 class="font-display text-5xl font-semibold tracking-tight text-white">Track Order</h1>
          <p class="text-lg text-zinc-400">Stay updated on your order status.</p>
        </div>
        <button type="button" class="button-secondary px-6">View Invoice</button>
      </div>

      <div class="panel-dark grid gap-4 p-6 lg:grid-cols-[1fr,1fr,120px] lg:items-center">
        <div>
          <p class="text-sm text-zinc-500">Estimated Delivery</p>
          <p class="mt-2 text-4xl font-semibold text-emerald-300">{{ estimatedDelivery() }}</p>
          <p class="mt-1 text-sm text-zinc-400">By 8:00 PM</p>
        </div>
        <div>
          <p class="text-sm text-zinc-500">Current Status</p>
          <p class="mt-2 text-4xl font-semibold text-emerald-300">{{ displayStatus() }}</p>
          <p class="mt-1 text-sm text-zinc-400">{{ statusMessage() }}</p>
        </div>
        <div class="flex justify-end">
          <span class="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10">
            <app-icon name="circle-check" [size]="28" className="text-emerald-300" />
          </span>
        </div>
      </div>

      <div class="panel-dark p-6">
        <div class="grid gap-6 md:grid-cols-5">
          @for (step of deliverySteps(); track step.label) {
            <div class="relative text-center">
              @if (!$last) {
                <span
                  class="absolute left-[calc(50%+32px)] right-[-50%] top-7 h-1 rounded-full"
                  [ngClass]="step.complete ? 'bg-emerald-400' : 'bg-white/10'"
                ></span>
              }
              <span
                class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border"
                [ngClass]="step.complete ? 'border-emerald-300/40 bg-emerald-500/16' : 'border-white/12 bg-white/[0.03]'"
              >
                <app-icon [name]="step.icon" [size]="20" [className]="step.complete ? 'text-emerald-300' : 'text-zinc-300'" />
              </span>
              <p class="mt-4 text-xl font-semibold text-white">{{ step.label }}</p>
              <p class="mt-2 text-sm text-zinc-400">{{ step.date }}</p>
            </div>
          }
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1fr,0.8fr,0.56fr]">
        <app-panel-card title="Tracking Details">
          <div class="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div>
              <p class="text-sm text-zinc-500">Carrier</p>
              <p class="mt-2 text-2xl font-semibold text-white">FedEx Express</p>
            </div>
            <div>
              <p class="text-sm text-zinc-500">Tracking Number</p>
              <p class="mt-2 text-2xl font-semibold text-white">{{ trackingNumber() }}</p>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            @for (event of timeline(); track event.label) {
              <div class="flex gap-4">
                <div class="flex flex-col items-center">
                  <span
                    class="mt-1 h-3 w-3 rounded-full"
                    [ngClass]="event.complete ? 'bg-emerald-400' : 'bg-white/20'"
                  ></span>
                  @if (!$last) {
                    <span class="mt-2 h-12 w-px bg-white/10"></span>
                  }
                </div>
                <div class="flex-1 pb-2">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="text-lg font-semibold" [ngClass]="event.complete ? 'text-emerald-300' : 'text-white'">
                      {{ event.label }}
                    </p>
                    <p class="text-sm text-zinc-500">{{ event.date }}</p>
                  </div>
                  <p class="mt-1 text-sm leading-6 text-zinc-400">{{ event.body }}</p>
                </div>
              </div>
            }
          </div>
        </app-panel-card>

        <app-panel-card title="Order Summary" [subtitle]="'Order #' + current.orderNumber">
          <div class="space-y-4">
            @for (item of enrichedItems(); track item.productId) {
              <div class="flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <img class="h-20 w-20 rounded-[18px] object-cover" [src]="item.product.imageUrls[0]" [alt]="item.productName" />
                <div class="min-w-0 flex-1">
                  <p class="line-clamp-2 text-lg font-semibold text-white">{{ item.productName }}</p>
                  <p class="mt-1 text-sm text-zinc-400">{{ item.variantLabel || 'Standard' }}</p>
                  <p class="mt-1 text-sm text-zinc-400">Qty: {{ item.quantity }}</p>
                </div>
                <p class="text-xl font-semibold text-white">{{ item.totalPrice | currency: 'USD' : 'symbol' : '1.2-2' }}</p>
              </div>
            }
          </div>
          <a routerLink="/account/orders" class="button-secondary mt-6 w-full justify-center">View Order Details</a>
        </app-panel-card>

        <div class="space-y-5">
          <app-panel-card title="Shipping Address">
            <p class="whitespace-pre-line text-base leading-8 text-zinc-300">{{ shippingAddress() }}</p>
          </app-panel-card>

          <app-panel-card title="Need Help?">
            <p class="text-sm leading-7 text-zinc-400">If you have any questions about your order, our support team is here to help.</p>
            <a href="mailto:support@shopflow.com" class="button-secondary mt-6 w-full justify-center">Contact Support</a>
          </app-panel-card>

          <app-panel-card title="More Actions">
            <div class="space-y-3">
              @for (action of moreActions; track action) {
                <button type="button" class="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-sm text-zinc-300 hover:text-white">
                  <span>{{ action }}</span>
                  <app-icon name="chevron-right" [size]="16" className="text-zinc-500" />
                </button>
              }
            </div>
          </app-panel-card>
        </div>
      </div>
    </div>
    } @else {
      <app-panel-card title="Order Tracking">
        <p class="text-sm text-zinc-400">Unable to load this order.</p>
      </app-panel-card>
    }
  `
})
export class OrderTrackingPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orders = inject(OrdersService);
  private readonly catalog = inject(CatalogService);

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
    { initialValue: [] as TrackingOrderItem[] }
  );

  readonly moreActions = ['Return or Replace Items', 'Download Invoice', 'Buy Again'];

  private orderOrThrow() {
    const order = this.order();
    if (!order) {
      throw new Error('Order unavailable');
    }
    return order;
  }

  readonly trackingNumber = computed(() => `77382${this.orderOrThrow().id}10432`);
  readonly shippingAddress = computed(() => this.orderOrThrow().shippingAddress.replaceAll(', ', '\n'));
  readonly estimatedDelivery = computed(() =>
    new Date(new Date(this.orderOrThrow().createdAt).getTime() + 1000 * 60 * 60 * 24 * 4).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  );
  readonly displayStatus = computed(() =>
    this.orderOrThrow().status === 'DELIVERED' ? 'Delivered' : this.orderOrThrow().status.replaceAll('_', ' ')
  );
  readonly statusMessage = computed(() => {
    switch (this.orderOrThrow().status) {
      case 'DELIVERED':
        return 'Your order has been delivered.';
      case 'SHIPPED':
        return 'Your order is on the way.';
      case 'PROCESSING':
        return 'Your order is being prepared.';
      default:
        return 'Your order has been received.';
    }
  });

  readonly deliverySteps = computed(() => {
    const order = this.orderOrThrow();
    const created = new Date(order.createdAt);
    const statusUpdated = new Date(order.statusUpdatedAt);
    const index = this.progressIndex(order.status);

    return [
      {
        label: 'Placed',
        icon: 'bag',
        date: created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        complete: index >= 0
      },
      {
        label: 'Processing',
        icon: 'package-open',
        date: new Date(created.getTime() + 1000 * 60 * 60 * 4).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        complete: index >= 1
      },
      {
        label: 'Shipped',
        icon: 'truck',
        date: statusUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        complete: index >= 2
      },
      {
        label: 'Out for Delivery',
        icon: 'map',
        date: new Date(statusUpdated.getTime() + 1000 * 60 * 60 * 8).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        complete: index >= 3
      },
      {
        label: 'Delivered',
        icon: 'circle-check',
        date: new Date(statusUpdated.getTime() + 1000 * 60 * 60 * 14).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        complete: index >= 4
      }
    ];
  });

  readonly timeline = computed(() => [
    {
      label: this.orderOrThrow().status === 'DELIVERED' ? 'Delivered' : 'Preparing final delivery',
      body: this.statusMessage(),
      date: new Date(this.orderOrThrow().statusUpdatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      complete: true
    },
    {
      label: 'Out for Delivery',
      body: 'Your package is out for delivery.',
      date: new Date(new Date(this.orderOrThrow().statusUpdatedAt).getTime() - 1000 * 60 * 60 * 4).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      complete: this.progressIndex(this.orderOrThrow().status) >= 3
    },
    {
      label: 'Arrived at Local Facility',
      body: 'Your package has arrived at the delivery facility.',
      date: new Date(new Date(this.orderOrThrow().statusUpdatedAt).getTime() - 1000 * 60 * 60 * 12).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      complete: this.progressIndex(this.orderOrThrow().status) >= 2
    },
    {
      label: 'In Transit',
      body: 'Your package is on the way.',
      date: new Date(new Date(this.orderOrThrow().createdAt).getTime() + 1000 * 60 * 60 * 18).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      complete: this.progressIndex(this.orderOrThrow().status) >= 2
    },
    {
      label: 'Order Placed',
      body: 'We have received your order.',
      date: new Date(this.orderOrThrow().createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      complete: true
    }
  ]);

  progressIndex(status: string): number {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'PAID':
      case 'PROCESSING':
        return 1;
      case 'SHIPPED':
        return 2;
      case 'DELIVERED':
        return 4;
      default:
        return 0;
    }
  }
}
