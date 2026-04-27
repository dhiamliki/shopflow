import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { SessionService } from '../../core/services/session.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';

@Component({
  selector: 'app-account-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, IconComponent, PanelCardComponent, ProductCardComponent, SectionHeadingComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <app-section-heading
        [title]="'Welcome back, ' + firstName()"
        subtitle="Everything important about your shopping activity is organized here."
      />

      <div class="grid gap-5 xl:grid-cols-[1fr,360px]">
        <section class="space-y-5">
          <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
                    <p class="text-lg font-semibold text-white">{{ order.totalAmount | currency: 'USD' : 'symbol' : '1.2-2' }}</p>
                    <p class="text-sm text-zinc-400">{{ order.status }}</p>
                  </div>
                </div>
              }
            </div>
          </app-panel-card>

          <app-panel-card title="Saved For Later" subtitle="Your latest saved items are ready whenever you are.">
            <div class="grid gap-5 md:grid-cols-3">
              @for (item of wishlistPreview(); track item.id) {
                <app-product-card [product]="item" context="compact" />
              }
            </div>
          </app-panel-card>
        </section>

        <aside class="space-y-5">
          <app-panel-card title="Notifications" subtitle="Unread updates across your orders and saved items.">
            @if (notificationPreview().length) {
              <div class="space-y-4">
                @for (item of notificationPreview(); track item.id) {
                  <div class="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                    <p class="text-sm text-zinc-500">{{ item.createdAtLabel }}</p>
                    <p class="mt-2 text-lg font-semibold text-white">{{ item.title }}</p>
                    <p class="mt-2 text-sm leading-6 text-zinc-400">{{ item.body }}</p>
                  </div>
                }
              </div>
            } @else {
              <app-empty-state
                icon="bell"
                title="No notifications"
                message="You're all caught up!"
              />
            }
          </app-panel-card>

          <app-panel-card title="Recommended For You" subtitle="Curated picks from our marketplace.">
            @if (recommendations().length) {
              <div class="space-y-4">
                @for (item of recommendations(); track item.id) {
                  <div class="flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                    <img class="h-16 w-16 rounded-[16px] object-cover" [src]="item.imageUrls[0]" [alt]="item.name" />
                    <div class="min-w-0 flex-1">
                      <p class="line-clamp-2 text-base font-semibold text-white">{{ item.name }}</p>
                      <p class="mt-1 text-sm text-zinc-400">{{ item.effectivePrice | currency: 'USD' : 'symbol' : '1.2-2' }}</p>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <app-empty-state
                icon="sparkles"
                title="No recommendations yet"
                message="Browse products to get personalized picks."
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
  private readonly workspace = inject(WorkspaceService);
  private readonly session = inject(SessionService);
  private readonly catalog = inject(CatalogService);

  readonly orders = toSignal(this.ordersService.loadMyOrders(), { initialValue: [] });
  readonly recommendations = toSignal(this.catalog.getTopSelling().pipe(map((products) => products.slice(0, 3))), {
    initialValue: []
  });

  readonly firstName = computed(() => this.session.user()?.firstName ?? 'there');
  readonly recentOrders = computed(() => this.orders().slice(0, 4));
  readonly wishlistPreview = computed(() => this.workspace.wishlist().slice(0, 3));
  readonly notificationPreview = computed(() => this.workspace.notifications().slice(0, 3));
  readonly stats = computed(() => [
    {
      icon: 'package',
      value: this.orders().length,
      label: 'Total Orders',
      meta: 'Orders'
    },
    {
      icon: 'bag',
      value: this.workspace.wishlist().length,
      label: 'Saved Items',
      meta: 'Wishlist'
    },
    {
      icon: 'bell',
      value: this.workspace.unreadNotificationCount(),
      label: 'Unread Updates',
      meta: 'Notifications'
    },
    {
      icon: 'card',
      value: this.orders()
        .reduce((total, order) => total + order.totalAmount, 0)
        .toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      label: 'Total Spent',
      meta: 'Lifetime'
    }
  ]);
}
