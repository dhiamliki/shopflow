import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { OrdersService } from '../../core/services/orders.service';
import { SessionService } from '../../core/services/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';

@Component({
  selector: 'app-seller-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, IconComponent, PanelCardComponent, EmptyStateComponent],
  template: `
    <div class="grid gap-6 xl:grid-cols-[1fr,360px]">
      <section class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-2">
            <h1 class="font-display text-5xl font-semibold tracking-tight text-white">
              Welcome back, {{ session.user()?.firstName || 'Seller' }}.
            </h1>
            <p class="text-lg text-zinc-400">Here's what's happening with your store today.</p>
          </div>
          <button type="button" class="button-secondary px-6">View Store</button>
        </div>

        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          @for (stat of statCards(); track stat.label) {
            <div class="panel-dark p-5">
              <div class="flex items-center justify-between">
                <span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <app-icon [name]="stat.icon" [size]="20" className="text-zinc-100" />
                </span>
              </div>
              <p class="mt-5 text-sm text-zinc-500">{{ stat.label }}</p>
              <p class="mt-2 text-4xl font-semibold tracking-tight text-white">{{ stat.value }}</p>
              @if (stat.delta) {
                <p class="mt-2 text-sm text-emerald-300">{{ stat.delta }}</p>
              }
            </div>
          }
        </div>

        @if (hasSalesData()) {
          <app-panel-card title="Sales Overview">
            <div class="flex items-center justify-end">
              <span class="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">Last 7 days</span>
            </div>
            <div class="mt-5 h-64 flex items-center justify-center text-zinc-500">
              <span class="text-sm">Sales chart integration pending backend data</span>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-4">
              @for (entry of metrics(); track entry.label) {
                <div class="border-l border-white/8 pl-4 first:border-l-0 first:pl-0">
                  <p class="text-sm text-zinc-500">{{ entry.label }}</p>
                  <p class="mt-2 text-3xl font-semibold text-white">{{ entry.value }}</p>
                </div>
              }
            </div>
          </app-panel-card>
        } @else {
          <app-panel-card title="Sales Overview">
            <app-empty-state
              icon="chart"
              title="No sales data yet"
              message="Start receiving orders to see your sales metrics here."
            />
          </app-panel-card>
        }

        <app-panel-card title="Quick Actions">
          <div class="grid gap-3 sm:grid-cols-2">
            <button type="button" class="button-secondary w-full justify-start">
              <app-icon name="plus" [size]="18" className="text-zinc-200" />
              Add new product
            </button>
            <button type="button" class="button-secondary w-full justify-start">
              <app-icon name="store" [size]="18" className="text-zinc-200" />
              Edit store profile
            </button>
            <button type="button" class="button-secondary w-full justify-start">
              <app-icon name="image" [size]="18" className="text-zinc-200" />
              Add store banner
            </button>
            <button type="button" class="button-secondary w-full justify-start">
              <app-icon name="settings" [size]="18" className="text-zinc-200" />
              Configure settings
            </button>
          </div>
        </app-panel-card>

        <div class="panel-dark flex items-center justify-between gap-4 p-5">
          <div class="flex items-center gap-4">
            <span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <app-icon name="sparkles" [size]="20" className="text-zinc-100" />
            </span>
            <div>
              <p class="text-xl font-semibold text-white">Pro Tip</p>
              <p class="mt-1 text-sm text-zinc-400">Use promoted listings to get more visibility and increase sales.</p>
            </div>
          </div>
          <button type="button" class="button-secondary px-6">Promote Listings</button>
        </div>
      </section>

      <aside class="space-y-5">
        <app-panel-card title="Recent Orders">
          @if (recentOrders().length) {
            <div class="space-y-4">
              @for (order of recentOrders(); track order.id) {
                <div class="flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-1 text-base font-semibold text-white">Order #{{ order.orderNumber }}</p>
                    <p class="mt-1 text-sm text-zinc-500">{{ order.items.length }} item(s)</p>
                  </div>
                  <div class="text-right">
                    <p class="rounded-full px-3 py-1 text-xs font-semibold" [ngClass]="{
                      'bg-emerald-500/15 text-emerald-300': order.status === 'DELIVERED',
                      'bg-amber-500/15 text-amber-300': order.status === 'PENDING' || order.status === 'PROCESSING',
                      'bg-blue-500/15 text-blue-300': order.status === 'SHIPPED'
                    }">{{ order.status }}</p>
                    <p class="mt-2 text-lg font-semibold text-white">{{ order.totalAmount | currency:'USD':'symbol':'1.2-2' }}</p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <app-empty-state
              icon="bag"
              title="No recent orders"
              message="Orders from buyers will appear here."
            />
          }
        </app-panel-card>

        <app-panel-card title="Announcements">
          @if (announcements().length) {
            <div class="space-y-4">
              @for (announcement of announcements(); track announcement.title) {
                <div class="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div class="flex items-start gap-4">
                    <span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                      <app-icon [name]="announcement.icon" [size]="20" className="text-zinc-100" />
                    </span>
                    <div>
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <p class="text-lg font-semibold text-white">{{ announcement.title }}</p>
                        <span class="text-xs text-zinc-500">{{ announcement.date }}</span>
                      </div>
                      <p class="mt-2 text-sm leading-6 text-zinc-400">{{ announcement.body }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <app-empty-state
              icon="megaphone"
              title="No announcements"
              message="Check back later for updates."
            />
          }
        </app-panel-card>
      </aside>
    </div>
  `
})
export class SellerDashboardPageComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly catalog = inject(CatalogService);
  private readonly ordersService = inject(OrdersService);
  readonly session = inject(SessionService);

  readonly sellerDashboard = toSignal(this.dashboard.getSellerDashboard(), {
    initialValue: {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      lowStockProducts: 0
    }
  });

  readonly sellerProducts = toSignal(
    this.catalog
      .listProducts({
        sellerId: this.session.user()?.id ?? undefined,
        size: 5
      })
      .pipe(map((response) => response.content)),
    { initialValue: [] }
  );

  readonly statCards = computed(() => [
    {
      icon: 'circle-dollar',
      label: 'Total Sales',
      value: (this.sellerDashboard()?.totalRevenue ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      delta: ''
    },
    {
      icon: 'bag',
      label: 'Orders',
      value: this.sellerDashboard()?.totalOrders ?? 0,
      delta: ''
    },
    {
      icon: 'package',
      label: 'Products',
      value: this.sellerDashboard()?.totalProducts ?? 0,
      delta: ''
    },
    {
      icon: 'alert-triangle',
      label: 'Low Stock',
      value: this.sellerDashboard()?.lowStockProducts ?? 0,
      delta: ''
    }
  ]);

  readonly hasSalesData = computed(() => (this.sellerDashboard()?.totalOrders ?? 0) > 0);

  readonly metrics = computed(() => {
    const total = this.sellerDashboard()?.totalRevenue ?? 0;
    return [
      { label: 'Total Revenue', value: total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
    ];
  });

  readonly recentOrders = toSignal(this.ordersService.loadMyOrders().pipe(map((orders) => orders.slice(0, 5))), {
    initialValue: []
  });
  readonly announcements = toSignal(
    map(() => [
      {
        icon: 'megaphone',
        title: 'Seller tools update',
        body: 'New analytics and listing tools are being rolled out this week.',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    ])(this.dashboard.getSellerDashboard()),
    { initialValue: [] as { icon: string; title: string; body: string; date: string }[] }
  );
}

