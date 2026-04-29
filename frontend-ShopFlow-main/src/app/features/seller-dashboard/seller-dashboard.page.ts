import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SellerDashboard } from '../../core/models/dashboard.models';
import { DashboardService } from '../../core/services/dashboard.service';
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
              {{ sellerProfile().shopName || ('Welcome back, ' + (session.user()?.firstName || 'Seller')) }}.
            </h1>
            <p class="text-lg text-zinc-400">{{ sellerProfile().description || "Here's what's happening with your store today." }}</p>
          </div>
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
          <app-panel-card title="Performance">
            <div class="grid gap-4 md:grid-cols-4">
              @for (entry of metrics(); track entry.label) {
                <div class="border-l border-white/8 pl-4 first:border-l-0 first:pl-0">
                  <p class="text-sm text-zinc-500">{{ entry.label }}</p>
                  <p class="mt-2 text-3xl font-semibold text-white">{{ entry.value }}</p>
                </div>
              }
            </div>
          </app-panel-card>
        } @else {
          <app-panel-card title="Performance">
            <app-empty-state
              icon="chart"
              title="No performance data yet"
              message="Start receiving orders to see your store performance here."
            />
          </app-panel-card>
        }

      </section>

      <aside class="space-y-5">
        <app-panel-card title="Recent Orders">
          @if (recentOrders().length) {
            <div class="space-y-4">
              @for (order of recentOrders(); track order.orderId) {
                <div class="flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-1 text-base font-semibold text-white">Order #{{ order.orderNumber }}</p>
                    <p class="mt-1 text-sm text-zinc-500">{{ order.createdAt | date: 'mediumDate' }}</p>
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

        <app-panel-card title="Best Sellers">
          @if (topProducts().length) {
            <div class="space-y-4">
              @for (product of topProducts(); track product.productId) {
                <div class="rounded-md border border-white/8 bg-white/[0.03] p-4">
                  <div class="flex items-start justify-between gap-4">
                    <p class="line-clamp-2 text-base font-semibold text-white">{{ product.productName }}</p>
                    <p class="shrink-0 text-sm font-semibold text-white">{{ product.revenue | currency:'USD':'symbol':'1.2-2' }}</p>
                  </div>
                  <p class="mt-2 text-sm text-zinc-500">{{ product.quantitySold }} sold</p>
                </div>
              }
            </div>
          } @else {
            <app-empty-state
              icon="package"
              title="No best sellers yet"
              message="Top-performing listings will appear here."
            />
          }
        </app-panel-card>
      </aside>
    </div>
  `
})
export class SellerDashboardPageComponent {
  private readonly dashboard = inject(DashboardService);
  readonly session = inject(SessionService);

  readonly sellerDashboard = toSignal(this.dashboard.getSellerDashboard(), {
    initialValue: EMPTY_SELLER_DASHBOARD
  });

  readonly sellerProfile = computed(() => this.sellerDashboard()?.profile ?? EMPTY_SELLER_DASHBOARD.profile);

  readonly statCards = computed(() => [
    {
      icon: 'circle-dollar',
      label: 'Revenue',
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
      label: 'Listings',
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
    const dashboard = this.sellerDashboard() ?? EMPTY_SELLER_DASHBOARD;
    const averageOrder = dashboard.totalOrders > 0 ? dashboard.totalRevenue / dashboard.totalOrders : 0;
    return [
      { label: 'Revenue', value: dashboard.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) },
      { label: 'Orders', value: dashboard.totalOrders },
      { label: 'Pending Orders', value: dashboard.pendingOrders },
      { label: 'Average Order', value: averageOrder.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }
    ];
  });

  readonly recentOrders = computed(() => this.sellerDashboard()?.recentOrders ?? []);
  readonly topProducts = computed(() => this.sellerDashboard()?.topProducts ?? []);
}

const EMPTY_SELLER_DASHBOARD: SellerDashboard = {
  profile: {
    sellerId: 0,
    sellerName: '',
    shopName: '',
    description: '',
    logoUrl: null,
    rating: 0
  },
  totalProducts: 0,
  totalOrders: 0,
  totalRevenue: 0,
  pendingOrders: 0,
  lowStockProducts: 0,
  topProducts: [],
  recentOrders: []
};
