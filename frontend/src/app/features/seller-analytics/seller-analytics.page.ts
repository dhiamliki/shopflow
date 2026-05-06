import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../core/services/dashboard.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

@Component({
  selector: 'app-seller-analytics-page',
  standalone: true,
  imports: [CommonModule, PanelCardComponent, EmptyStateComponent, TndCurrencyPipe],
  template: `
    <div class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-4xl font-semibold tracking-tight text-white">Analytics</h1>
        <p class="text-sm text-zinc-400">Live performance metrics for your store.</p>
      </header>

      @if (dashboard(); as stats) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="panel-dark p-5">
            <p class="text-sm text-zinc-500">Revenue</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ stats.totalRevenue | tndCurrency }}</p>
          </div>
          <div class="panel-dark p-5">
            <p class="text-sm text-zinc-500">Orders</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ stats.totalOrders }}</p>
          </div>
          <div class="panel-dark p-5">
            <p class="text-sm text-zinc-500">Pending Orders</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ stats.pendingOrders }}</p>
          </div>
          <div class="panel-dark p-5">
            <p class="text-sm text-zinc-500">Low Stock Listings</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ stats.lowStockProducts }}</p>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <app-panel-card title="Top Products">
            @if (stats.topProducts.length) {
              <div class="space-y-3">
                @for (product of stats.topProducts; track product.productId) {
                  <div class="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div>
                      <p class="text-sm font-semibold text-white">{{ product.productName }}</p>
                      <p class="text-xs text-zinc-400">{{ product.quantitySold }} sold</p>
                    </div>
                    <p class="text-sm font-semibold text-white">{{ product.revenue | tndCurrency }}</p>
                  </div>
                }
              </div>
            } @else {
              <app-empty-state icon="package" title="No sales yet" message="Top products appear after your first sales." />
            }
          </app-panel-card>

          <app-panel-card title="Recent Orders">
            @if (stats.recentOrders.length) {
              <div class="space-y-3">
                @for (order of stats.recentOrders; track order.orderId) {
                  <div class="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-white">#{{ order.orderNumber }}</p>
                      <p class="text-xs text-zinc-400">{{ order.status }}</p>
                    </div>
                    <p class="mt-1 text-xs text-zinc-500">{{ order.createdAt | date: 'medium' }}</p>
                    <p class="mt-1 text-sm text-white">{{ order.totalAmount | tndCurrency }}</p>
                  </div>
                }
              </div>
            } @else {
              <app-empty-state icon="bag" title="No recent orders" message="Recent orders appear here when customers buy." />
            }
          </app-panel-card>
        </div>
      } @else {
        <app-empty-state icon="chart" title="No analytics data" message="Unable to load analytics right now." />
      }
    </div>
  `
})
export class SellerAnalyticsPageComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly dashboard = toSignal(this.dashboardService.getSellerDashboard(), { initialValue: null });
  readonly hasData = computed(() => (this.dashboard()?.totalOrders ?? 0) > 0);
}
