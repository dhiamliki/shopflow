import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { Order, Product } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

type OrderCard = Order & { leadProduct: Product | null };

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    IconComponent,
    PanelCardComponent,
    SectionHeadingComponent,
    StatusBadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="space-y-6">
      <app-section-heading title="My Orders" subtitle="Track, return, or buy again." />
      <div class="grid gap-6 xl:grid-cols-[1fr,330px]">
        <section class="space-y-5">
          <div class="flex flex-wrap gap-6 border-b border-white/8">
            @for (tab of tabs; track tab.value) {
              <button
                type="button"
                class="relative pb-5 text-lg font-medium transition"
                [ngClass]="activeTab() === tab.value ? 'text-white' : 'text-zinc-400 hover:text-white'"
                (click)="activeTab.set(tab.value)"
              >
                {{ tab.label }}
                @if (activeTab() === tab.value) {
                  <span class="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-400"></span>
                }
              </button>
            }
          </div>

          <div class="space-y-4">
            @if (filteredOrders().length) {
              @for (order of filteredOrders(); track order.id) {
                <article class="panel-dark grid gap-5 p-5 xl:grid-cols-[130px,1fr,260px,160px] xl:items-center">
                  <img
                    class="h-[130px] w-[130px] rounded-[22px] object-cover"
                    [src]="order.leadProduct?.imageUrls?.[0]"
                    [alt]="order.items[0]?.productName || order.orderNumber"
                  />
                  <div class="space-y-4">
                    <div>
                      <p class="text-xl font-semibold text-white">Order #{{ order.orderNumber }}</p>
                      <p class="mt-1 text-sm text-zinc-500">{{ order.createdAt | date: 'mediumDate' }}</p>
                    </div>
                    <div>
                      <p class="text-[1.45rem] font-semibold text-white">{{ order.items[0]?.productName || 'Order items' }}</p>
                      <p class="mt-2 text-sm text-zinc-400">
                        {{ order.items.length }} item{{ order.items.length > 1 ? 's' : '' }}
                        @if (order.items[0]?.variantLabel) {
                          <span> | {{ order.items[0].variantLabel }}</span>
                        }
                      </p>
                    </div>
                    <p class="text-2xl font-semibold text-white">
                      {{ order.totalAmount | currency: 'USD' : 'symbol' : '1.2-2' }}
                    </p>
                  </div>
                  <div class="space-y-4">
                    <app-status-badge [status]="order.status" />
                    <p class="text-sm text-zinc-400">{{ orderStatusCaption(order.status) }}</p>
                    <div class="relative flex items-center justify-between text-xs text-zinc-500">
                      <span class="absolute left-0 right-0 top-3 h-px bg-white/10"></span>
                      @for (step of progressSteps; track step) {
                        <span class="relative z-10 flex flex-col items-center gap-3">
                          <span
                            class="h-3 w-3 rounded-full border"
                            [ngClass]="progressIndex(order.status) >= $index ? 'border-emerald-300 bg-emerald-400' : 'border-white/20 bg-black'"
                          ></span>
                          <span class="text-center">{{ step }}</span>
                        </span>
                      }
                    </div>
                  </div>
                  <div class="space-y-3 text-right">
                    <a [routerLink]="['/account/orders', order.id]" class="button-secondary w-full justify-center">View Details</a>
                    @if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
                      <a [routerLink]="['/account/orders', order.id]" class="text-sm font-semibold text-zinc-300 hover:text-white">
                        Track Package
                      </a>
                    }
                    @if (order.status === 'PENDING' || order.status === 'PAID') {
                      <button type="button" class="text-sm font-semibold text-zinc-300 hover:text-white" (click)="cancel(order.id)">
                        Cancel Order
                      </button>
                    }
                    @if (order.status === 'DELIVERED') {
                      <button type="button" class="text-sm font-semibold text-zinc-300 hover:text-white">Buy Again</button>
                    }
                  </div>
                </article>
              }
            } @else {
              <app-empty-state
                icon="package"
                title="No orders yet"
                message="When you place orders, they will appear here."
              />
            }
          </div>
        </section>

        <aside class="space-y-5">
          <app-panel-card title="Order Summary">
            <div class="space-y-4 text-lg">
              @for (entry of summaryRows(); track entry.label) {
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">{{ entry.label }}</span>
                  <span class="text-white">{{ entry.value }}</span>
                </div>
              }
            </div>
            <a routerLink="/account/orders" class="button-primary mt-6 w-full justify-center">View All Orders</a>
          </app-panel-card>

          <app-panel-card title="Need Help?">
            <div class="space-y-4">
              @for (help of helpLinks; track help.title) {
                <div class="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <p class="text-lg font-semibold text-white">{{ help.title }}</p>
                  <p class="mt-2 text-sm leading-6 text-zinc-400">{{ help.body }}</p>
                </div>
              }
            </div>
            <a href="mailto:support@shopflow.com" class="button-secondary mt-6 w-full justify-center">Contact Support</a>
          </app-panel-card>

          <app-panel-card title="Shop With Confidence">
            <div class="space-y-4">
              @for (trust of trustItems; track trust.title) {
                <div class="flex items-start gap-4">
                  <app-icon [name]="trust.icon" [size]="18" className="mt-1 text-zinc-200" />
                  <div>
                    <p class="text-lg font-semibold text-white">{{ trust.title }}</p>
                    <p class="mt-2 text-sm leading-6 text-zinc-400">{{ trust.body }}</p>
                  </div>
                </div>
              }
            </div>
          </app-panel-card>
        </aside>
      </div>
    </div>
  `
})
export class OrdersPageComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly catalog = inject(CatalogService);

  readonly activeTab = signal<'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAID'>('ALL');

  readonly orders = toSignal(
    this.ordersService.loadMyOrders().pipe(
      switchMap((orders) =>
        this.catalog.getProductsByIds(orders.flatMap((order) => order.items.map((item) => item.productId))).pipe(
          map((products) =>
            orders.map((order) => ({
              ...order,
              leadProduct: products.find((product) => product.id === order.items[0]?.productId) ?? null
            }))
          )
        )
      )
    ),
    { initialValue: [] as OrderCard[] }
  );

  readonly filteredOrders = computed(() =>
    this.orders().filter((order) => this.activeTab() === 'ALL' || order.status === this.activeTab())
  );

  readonly tabs = [
    { label: 'All Orders', value: 'ALL' as const },
    { label: 'To Pay', value: 'PENDING' as const },
    { label: 'Processing', value: 'PROCESSING' as const },
    { label: 'Shipped', value: 'SHIPPED' as const },
    { label: 'Delivered', value: 'DELIVERED' as const },
    { label: 'Cancelled', value: 'CANCELLED' as const }
  ];
  readonly progressSteps = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  readonly helpLinks = [
    {
      title: 'Where is my order?',
      body: 'Track your order status and delivery progress.'
    },
    {
      title: 'Returns & Refunds',
      body: 'Request a return or check refund status.'
    },
    {
      title: 'Help Center',
      body: 'Find answers to common questions quickly.'
    }
  ];
  readonly trustItems = [
    {
      icon: 'shield-check',
      title: 'Secure Payments',
      body: 'Your payment information is always protected.'
    },
    {
      icon: 'shield',
      title: 'Buyer Protection',
      body: 'Get help if your order is not as described.'
    }
  ];

  readonly summaryRows = computed(() => [
    { label: 'Total Orders', value: this.orders().length },
    { label: 'To Pay', value: this.orders().filter((order) => order.status === 'PENDING').length },
    { label: 'Processing', value: this.orders().filter((order) => order.status === 'PROCESSING').length },
    { label: 'Shipped', value: this.orders().filter((order) => order.status === 'SHIPPED').length },
    { label: 'Delivered', value: this.orders().filter((order) => order.status === 'DELIVERED').length },
    { label: 'Cancelled', value: this.orders().filter((order) => order.status === 'CANCELLED').length }
  ]);

  cancel(orderId: number): void {
    this.ordersService.cancelOrder(orderId).subscribe(() => {
      this.ordersService.loadMyOrders().subscribe();
    });
  }

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
        return 3;
      default:
        return 0;
    }
  }

  orderStatusCaption(status: string): string {
    switch (status) {
      case 'DELIVERED':
        return 'Delivered successfully';
      case 'SHIPPED':
        return 'Your package is on the way';
      case 'PROCESSING':
        return 'We are preparing your order';
      case 'PENDING':
      case 'PAID':
        return 'Waiting for the next fulfillment step';
      default:
        return 'This order has been cancelled';
    }
  }
}


