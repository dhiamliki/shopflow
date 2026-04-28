import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-sell-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="sf-page py-12">
      <div class="grid gap-8 xl:grid-cols-[0.9fr,1.02fr] xl:items-center">
        <div class="space-y-8">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300">
            <app-icon name="chart" [size]="16" className="text-zinc-200" />
            Built for Sellers
          </div>

          <div class="space-y-5">
            <h1 class="font-display text-6xl font-semibold tracking-[-0.06em] text-white sm:text-7xl">
              Sell smarter.<br />
              Grow faster.
            </h1>
            <p class="max-w-2xl text-2xl leading-10 text-zinc-400">
              Shopflow gives you everything you need to list, manage, and grow your business - all in one place.
            </p>
          </div>

          <div class="flex flex-wrap gap-4">
            <button type="button" (click)="onStartSelling()" class="button-primary px-8">
              Start Selling
              <app-icon name="arrow-right" [size]="18" className="text-black" />
            </button>
            <a routerLink="/how-it-works" class="button-secondary px-8">
              How It Works
              <app-icon name="circle-check" [size]="18" className="text-white" />
            </a>
          </div>

          <div class="grid gap-5 sm:grid-cols-4">
            @for (feature of features; track feature.title) {
              <div class="flex items-start gap-4">
                <app-icon [name]="feature.icon" [size]="20" className="mt-1 text-zinc-200" />
                <div>
                  <p class="text-lg font-semibold text-white">{{ feature.title }}</p>
                  <p class="mt-2 text-sm leading-6 text-zinc-400">{{ feature.body }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="panel-dark overflow-hidden p-3">
          <div class="grid min-h-[430px] grid-cols-[170px,1fr]">
            <aside class="border-r border-white/10 p-5">
              <div class="mb-5 flex items-center gap-2 text-lg font-semibold">
                <app-icon name="bag" [size]="20" className="text-white" />
                shopflow
              </div>
              <div class="space-y-2 text-sm text-zinc-300">
                @for (item of ['Dashboard', 'Listings', 'Orders', 'Messages', 'Analytics', 'Payouts', 'Reviews', 'Settings']; track item) {
                  <div [class]="item === 'Dashboard' ? 'rounded-md bg-white/10 px-3 py-2' : 'rounded-md px-3 py-2'">{{ item }}</div>
                }
              </div>
            </aside>
            <div class="p-6">
              <div class="mb-5 flex items-center justify-between">
                <h3 class="text-xl font-semibold text-white">Overview</h3>
                <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300">Last 30 days</button>
              </div>
              <div class="grid grid-cols-4 gap-3">
                @for (metric of previewMetrics; track metric.label) {
                  <div class="rounded-md border border-white/8 bg-white/[0.03] p-4">
                    <p class="text-xs text-zinc-400">{{ metric.label }}</p>
                    <p class="mt-2 text-2xl font-semibold text-white">{{ metric.value }}</p>
                    <p class="mt-2 text-xs text-emerald-300">{{ metric.delta }}</p>
                  </div>
                }
              </div>
              <div class="mt-4 grid grid-cols-[1fr,260px] gap-4">
                <div class="rounded-md border border-white/8 bg-white/[0.03] p-5">
                  <div class="flex items-center justify-between">
                    <p class="font-semibold text-white">Sales Overview</p>
                    <span class="rounded-md bg-white px-3 py-1 text-xs font-semibold text-black">Live</span>
                  </div>
                  <div class="mt-5 h-40 rounded-md bg-[linear-gradient(180deg,rgba(73,217,130,.16),rgba(73,217,130,.02)),linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[length:auto,80px_40px,80px_40px]"></div>
                </div>
                <div class="rounded-md border border-white/8 bg-white/[0.03] p-5">
                  <div class="flex items-center justify-between">
                    <p class="font-semibold text-white">Recent Orders</p>
                    <span class="text-xs text-zinc-400">View all</span>
                  </div>
                  <div class="mt-4 space-y-3">
                    @if (previewOrders.length) {
                      @for (order of previewOrders; track order.id) {
                      <div class="flex items-center justify-between gap-3 text-sm">
                        <span>
                          <span class="block font-semibold text-white">Order #{{ order.id }}</span>
                          <span class="text-xs text-zinc-500">May {{ order.day }}, 2025</span>
                        </span>
                        <span class="font-semibold text-white">{{ order.total }}</span>
                      </div>
                      }
                    } @else {
                      <p class="text-sm text-zinc-500">Recent orders appear from backend order data.</p>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-12 space-y-10">
        <h2 class="text-center text-3xl font-semibold tracking-tight text-white">Everything you need to succeed</h2>
        <div class="grid gap-5 md:grid-cols-5">
          @for (benefit of benefits; track benefit.title) {
            <div class="flex items-start gap-4">
              <app-icon [name]="benefit.icon" [size]="22" className="mt-1 text-zinc-200" />
              <div>
                <p class="text-xl font-semibold text-white">{{ benefit.title }}</p>
                <p class="mt-2 text-sm leading-7 text-zinc-400">{{ benefit.body }}</p>
              </div>
            </div>
          }
        </div>

        <div
          class="panel-dark flex flex-wrap items-center justify-between gap-6 overflow-hidden p-6 sm:p-8"
          style="
            background:
              linear-gradient(90deg, rgba(255,255,255,0.04), transparent 50%),
              radial-gradient(40rem 16rem at 100% 100%, rgba(255,255,255,0.08), transparent 70%),
              linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          "
        >
          <div>
            <h3 class="text-3xl font-semibold tracking-tight text-white">Ready to grow your business?</h3>
            <p class="mt-3 text-lg text-zinc-400">Join thousands of sellers who are already earning on Shopflow.</p>
          </div>
          <button type="button" (click)="onStartSelling()" class="button-primary px-8">
            Create Your Seller Account
            <app-icon name="arrow-right" [size]="18" className="text-black" />
          </button>
        </div>
      </div>
    </section>
  `
})
export class SellPageComponent {
  private readonly navigation = inject(NavigationService);

  onStartSelling(): void {
    this.navigation.navigateToSelling();
  }

  readonly features = [
    {
      icon: 'badge-percent',
      title: 'Easy Listing',
      body: 'List your products in minutes with polished image and inventory controls.'
    },
    {
      icon: 'user',
      title: 'More Buyers',
      body: 'Reach thousands of active buyers across categories.'
    },
    {
      icon: 'shield-check',
      title: 'Secure Payments',
      body: 'Get paid safely and on time with built-in buyer protection.'
    },
    {
      icon: 'chart',
      title: 'Real Insights',
      body: 'Track your sales, product performance, and low stock quickly.'
    }
  ];

  readonly benefits = [
    {
      icon: 'sparkles',
      title: 'Quick & Simple Setup',
      body: 'Create your seller account and start listing in just a few steps.'
    },
    {
      icon: 'briefcase',
      title: 'Powerful Seller Tools',
      body: 'Manage inventory, orders, and customers with ease.'
    },
    {
      icon: 'badge-percent',
      title: 'Marketing That Works',
      body: 'Promote your products and boost your visibility.'
    },
    {
      icon: 'wallet',
      title: 'Payouts You Can Count On',
      body: 'Withdraw your earnings quickly and securely.'
    }
  ];

  readonly previewMetrics = [
    { label: 'Total Sales', value: 'Live', delta: 'From completed orders' },
    { label: 'Orders', value: 'Live', delta: 'Seller-specific' },
    { label: 'Active Listings', value: 'Live', delta: 'From product records' },
    { label: 'Low Stock', value: 'Live', delta: 'From inventory records' }
  ];

  readonly previewOrders: Array<{ id: number; day: number; total: string }> = [];
}
