import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { SessionService } from '../../core/services/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';
import { formatTndCurrency } from '../../shared/utils/currency';

@Component({
  selector: 'app-account-dashboard-page',
  standalone: true,
  imports: [CommonModule, TndCurrencyPipe, IconComponent, PanelCardComponent, SectionHeadingComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <app-section-heading
        [title]="'Welcome back, ' + firstName()"
        subtitle="Everything important about your shopping activity is organized here."
      />

      <div class="grid gap-5 xl:grid-cols-[1fr,360px]">
        <section class="space-y-5">
          <div class="grid gap-5 sm:grid-cols-2">
            @for (stat of stats(); track stat.label) {
              <div class="panel-dark p-5">
                <div class="flex items-center justify-between">
                  <span class="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                    <app-icon [name]="stat.icon" [size]="20" className="text-zinc-100" />
                  </span>
                  <span class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ stat.meta }}</span>
                </div>
                <p class="mt-5 text-4xl font-semibold tracking-tight text-white">{{ stat.value }}</p>
                <p class="mt-2 text-sm text-zinc-400">{{ stat.label }}</p>
              </div>
            }
          </div>

          <app-panel-card title="Recent Orders" subtitle="Track the latest updates on your recent purchases.">
            <div class="space-y-4">
              @for (order of recentOrders(); track order.id) {
                <div class="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4">
                  <div>
                    <p class="text-lg font-semibold text-white">#{{ order.orderNumber }}</p>
                    <p class="text-sm text-zinc-400">{{ order.items[0]?.productName || 'Order items' }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-semibold text-white">{{ order.totalAmount | tndCurrency }}</p>
                    <p class="text-sm text-zinc-400">{{ order.status }}</p>
                  </div>
                </div>
              }
            </div>
          </app-panel-card>
        </section>

        <aside class="space-y-5">
          <app-panel-card title="Top-selling Picks" subtitle="Popular products from current marketplace data.">
            @if (recommendations().length) {
              <div class="space-y-4">
                @for (item of recommendations(); track item.id) {
                  <div class="flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                    <img class="h-16 w-16 rounded-[16px] object-cover" [src]="item.imageUrls[0]" [alt]="item.name" />
                    <div class="min-w-0 flex-1">
                      <p class="line-clamp-2 text-base font-semibold text-white">{{ item.name }}</p>
                      <p class="mt-1 text-sm text-zinc-400">{{ item.effectivePrice | tndCurrency }}</p>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <app-empty-state
                icon="sparkles"
                title="No recommendations yet"
                message="Top-selling products will appear here once marketplace data is available."
              />
            }
          </app-panel-card>
        </aside>
      </div>
    </div>
  `
})
export class AccountDashboardPageComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly session = inject(SessionService);
  private readonly catalog = inject(CatalogService);

  readonly orders = toSignal(this.ordersService.loadMyOrders(), { initialValue: [] });
  readonly recommendations = toSignal(this.catalog.getTopSelling().pipe(map((products) => products.slice(0, 3))), {
    initialValue: []
  });

  readonly firstName = computed(() => this.session.user()?.firstName ?? 'there');
  readonly recentOrders = computed(() => this.orders().slice(0, 4));
  readonly stats = computed(() => [
    {
      icon: 'package',
      value: this.orders().length,
      label: 'Total Orders',
      meta: 'Orders'
    },
    {
      icon: 'card',
      value: formatTndCurrency(
        this.orders().reduce((total, order) => total + order.totalAmount, 0)
      ),
      label: 'Total Spent',
      meta: 'Lifetime'
    }
  ]);
}
