import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SellerDashboard } from '../../core/models/dashboard.models';
import { CatalogService } from '../../core/services/catalog.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { SessionService } from '../../core/services/session.service';
import { resolveProductImageUrl } from '../../core/utils/image-url.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';
import { formatTndCurrency } from '../../shared/utils/currency';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-seller-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TndCurrencyPipe, IconComponent, PanelCardComponent, EmptyStateComponent],
  template: `
    <div class="grid gap-6 xl:grid-cols-[1fr,360px]">
      <section class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="space-y-2">
            <h1 class="font-display text-5xl font-semibold tracking-tight text-white">
              Welcome back, {{ session.user()?.firstName || 'Seller' }}.
            </h1>
            <p class="text-lg text-zinc-400">{{ sellerProfile().shopName || sellerProfile().sellerName }}</p>
          </div>
          @if (sellerProfile().sellerId > 0) {
            <a [routerLink]="['/store', sellerProfile().sellerId]" class="button-secondary min-h-10 px-4 text-sm">
              View Store
            </a>
          }
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

        <app-panel-card title="Store Metrics">
          <div class="grid gap-4 sm:grid-cols-2">
            @for (entry of metrics(); track entry.label) {
              <div class="rounded-md border border-white/8 bg-white/[0.03] p-4">
                <p class="text-xs uppercase tracking-wide text-zinc-500">{{ entry.label }}</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ entry.value }}</p>
              </div>
            }
          </div>
        </app-panel-card>
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
                    <p class="mt-2 text-lg font-semibold text-white">{{ order.totalAmount | tndCurrency }}</p>
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

        <app-panel-card title="Listings Preview">
          @if (listingPreview().length) {
            <div class="space-y-4">
              @for (product of listingPreview(); track product.id) {
                <div class="flex items-center gap-3 rounded-md border border-white/8 bg-white/[0.03] p-3">
                  <div class="sf-product-media-well h-14 w-14 overflow-hidden rounded-md">
                    <img class="sf-product-card-image h-full w-full" [src]="imageUrl(product.imageUrls[0])" [alt]="product.name" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-1 text-sm font-semibold text-white">{{ product.name }}</p>
                    <p class="mt-1 text-xs text-zinc-400">{{ product.stock }} in stock</p>
                  </div>
                  <p class="text-sm font-semibold text-white">{{ product.effectivePrice | tndCurrency }}</p>
                </div>
              }
            </div>
            <a routerLink="/seller/listings" class="button-secondary mt-5 w-full justify-center text-sm">View Listings</a>
          } @else {
            <app-empty-state
              icon="package"
              title="No listings yet"
              message="Create a listing to start selling."
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
  readonly session = inject(SessionService);

  readonly sellerDashboard = toSignal(this.dashboard.getSellerDashboard(), {
    initialValue: EMPTY_SELLER_DASHBOARD
  });

  readonly sellerProfile = computed(() => this.sellerDashboard()?.profile ?? EMPTY_SELLER_DASHBOARD.profile);
  readonly listingsPage = toSignal(this.catalog.getMyListings(0, 5), {
    initialValue: {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 5,
      number: 0,
      first: true,
      last: true
    }
  });

  readonly statCards = computed(() => [
    {
      icon: 'circle-dollar',
      label: 'Revenue',
      value: formatTndCurrency(this.sellerDashboard()?.totalRevenue ?? 0),
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

  readonly metrics = computed(() => {
    const dashboard = this.sellerDashboard() ?? EMPTY_SELLER_DASHBOARD;
    const averageOrder = dashboard.totalOrders > 0 ? dashboard.totalRevenue / dashboard.totalOrders : 0;
    return [
      { label: 'Revenue', value: formatTndCurrency(dashboard.totalRevenue) },
      { label: 'Orders', value: dashboard.totalOrders },
      { label: 'Pending Orders', value: dashboard.pendingOrders },
      { label: 'Average Order', value: formatTndCurrency(averageOrder) }
    ];
  });

  readonly recentOrders = computed(() => this.sellerDashboard()?.recentOrders ?? []);
  readonly listingPreview = computed(() => this.listingsPage().content ?? []);

  imageUrl(raw: string): string {
    return resolveProductImageUrl(raw);
  }
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
