import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { OrderStatus } from '../../core/models/commerce.models';
import { OrdersService } from '../../core/services/orders.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

type StatusFilter = 'ALL' | OrderStatus;

@Component({
  selector: 'app-seller-orders-page',
  standalone: true,
  imports: [CommonModule, TndCurrencyPipe, SectionHeadingComponent, StatusBadgeComponent, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <app-section-heading title="Received Orders" subtitle="Orders that include your products." />

      <div class="flex flex-wrap gap-3 border-b border-white/8 pb-4">
        @for (tab of tabs; track tab.value) {
          <button
            type="button"
            class="button-secondary min-h-9 px-4 text-sm"
            [ngClass]="activeTab() === tab.value ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : ''"
            (click)="activeTab.set(tab.value)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (filteredOrders().length) {
        <div class="space-y-4">
          @for (order of filteredOrders(); track order.id) {
            <article class="panel-dark space-y-5 p-5">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="space-y-1.5">
                  <p class="text-xl font-semibold text-white">Order #{{ order.orderNumber }}</p>
                  <p class="text-sm text-zinc-400">{{ order.createdAt | date: 'medium' }}</p>
                  <p class="text-sm text-zinc-300">
                    Buyer: {{ order.buyerName }} ({{ order.buyerEmail }})
                  </p>
                </div>
                <div class="space-y-3 text-right">
                  <app-status-badge [status]="order.status" />
                  <p class="text-lg font-semibold text-white">{{ order.sellerTotal | tndCurrency }}</p>
                </div>
              </div>

              <div class="space-y-3 border-t border-white/8 pt-4">
                @for (item of order.items; track item.productId + '-' + item.variantId) {
                  <div class="grid gap-2 text-sm text-zinc-300 sm:grid-cols-[1fr,120px,120px,120px]">
                    <p class="font-medium text-white">
                      {{ item.productName }}
                      @if (item.variantLabel) {
                        <span class="text-zinc-400">({{ item.variantLabel }})</span>
                      }
                    </p>
                    <p>Qty: {{ item.quantity }}</p>
                    <p>{{ item.unitPrice | tndCurrency }}</p>
                    <p class="font-semibold text-white">{{ item.totalPrice | tndCurrency }}</p>
                  </div>
                }
              </div>

              @if (nextStatus(order.status); as next) {
                <div class="flex justify-end border-t border-white/8 pt-4">
                  <button
                    type="button"
                    class="button-primary min-h-10 px-4 text-sm"
                    [disabled]="updatingOrderId() === order.id"
                    (click)="updateStatus(order.id, next)"
                  >
                    Mark as {{ next }}
                  </button>
                </div>
              }
            </article>
          }
        </div>
      } @else {
        <app-empty-state
          icon="package"
          title="No received orders"
          message="Orders containing your products will appear here."
        />
      }
    </div>
  `
})
export class SellerOrdersPageComponent {
  private readonly ordersService = inject(OrdersService);

  readonly activeTab = signal<StatusFilter>('ALL');
  readonly updatingOrderId = signal<number | null>(null);

  readonly orders = this.ordersService.sellerOrders;
  readonly filteredOrders = computed(() =>
    this.orders().filter((order) => this.activeTab() === 'ALL' || order.status === this.activeTab())
  );

  readonly tabs: Array<{ label: string; value: StatusFilter }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  constructor() {
    this.ordersService.loadSellerOrders().subscribe();
  }

  updateStatus(orderId: number, status: OrderStatus): void {
    this.updatingOrderId.set(orderId);
    this.ordersService
      .updateOrderStatus(orderId, status)
      .pipe(finalize(() => this.updatingOrderId.set(null)))
      .subscribe(() => {
        this.ordersService.loadSellerOrders().subscribe();
      });
  }

  nextStatus(status: OrderStatus): OrderStatus | null {
    switch (status) {
      case 'PENDING':
        return 'PAID';
      case 'PAID':
        return 'PROCESSING';
      case 'PROCESSING':
        return 'SHIPPED';
      case 'SHIPPED':
        return 'DELIVERED';
      default:
        return null;
    }
  }
}
