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
      <div class="grid gap-8 xl:grid-cols-[0.74fr,1.16fr] xl:items-center">
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

          <div class="grid gap-5 sm:grid-cols-2">
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

        <div class="panel-dark overflow-hidden p-3 sm:p-4">
          <div class="overflow-hidden rounded-md border border-white/10 bg-zinc-950/85">
            <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
              <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                  <app-icon name="store" [size]="18" className="text-white" />
                </span>
                <div>
                  <p class="text-sm font-semibold text-white">Seller Dashboard</p>
                  <p class="text-xs text-zinc-500">Listings, orders, revenue, inventory</p>
                </div>
              </div>
              <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300">Last 30 days</button>
            </div>

            <div class="grid gap-0 lg:grid-cols-[172px,minmax(0,1fr)]">
              <aside class="hidden border-r border-white/10 p-4 lg:block">
                <div class="space-y-1 text-sm text-zinc-300">
                  @for (item of ['Dashboard', 'Listings', 'Orders', 'Revenue', 'Inventory', 'Performance']; track item) {
                    <div [class]="item === 'Dashboard' ? 'rounded-md bg-white/10 px-3 py-2 text-white' : 'rounded-md px-3 py-2 text-zinc-400'">{{ item }}</div>
                  }
                </div>
              </aside>

              <div class="space-y-4 p-4 sm:p-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="text-xl font-semibold text-white">Dashboard</h3>
                    <p class="mt-1 text-sm text-zinc-500">Store activity and performance in one workspace.</p>
                  </div>
                  <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300">Performance</button>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  @for (metric of previewMetrics; track metric.label) {
                    <div class="rounded-md border border-white/8 bg-white/[0.03] p-4">
                      <span class="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-black/25">
                        <app-icon [name]="metric.icon" [size]="16" className="text-zinc-100" />
                      </span>
                      <p class="mt-4 text-sm font-semibold text-white">{{ metric.label }}</p>
                      <p class="mt-1 text-xs leading-5 text-zinc-500">{{ metric.detail }}</p>
                      <div class="mt-4 space-y-1.5">
                        <span class="block h-1.5 w-full rounded-full bg-white/8"></span>
                        <span class="block h-1.5 w-2/3 rounded-full bg-emerald-400/45"></span>
                      </div>
                    </div>
                  }
                </div>

                <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr),270px]">
                  <div class="rounded-md border border-white/8 bg-white/[0.03] p-5">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <p class="font-semibold text-white">Revenue Trend</p>
                        <p class="mt-1 text-xs text-zinc-500">Orders, revenue, and store performance</p>
                      </div>
                      <span class="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">Weekly</span>
                    </div>
                    <div class="mt-5 flex h-44 items-end gap-2 rounded-md border border-white/8 bg-black/20 px-4 pb-4 pt-5">
                      @for (bar of previewChart; track $index) {
                        <span class="flex-1 rounded-t-md bg-gradient-to-t from-emerald-500/35 to-white/70" [style.height.%]="bar"></span>
                      }
                    </div>
                    <div class="mt-4 grid grid-cols-3 gap-3 text-xs text-zinc-500">
                      <span>Revenue</span>
                      <span>Orders</span>
                      <span>Inventory</span>
                    </div>
                  </div>

                  <div class="rounded-md border border-white/8 bg-white/[0.03] p-5">
                    <div class="flex items-center justify-between">
                      <p class="font-semibold text-white">Store Activity</p>
                      <span class="text-xs text-zinc-500">Today</span>
                    </div>
                    <div class="mt-4 space-y-3">
                      @for (step of previewActivity; track step.label) {
                        <div class="flex items-center gap-3 rounded-md border border-white/8 bg-black/20 px-3 py-3">
                          <app-icon [name]="step.icon" [size]="16" className="text-zinc-200" />
                          <span>
                            <span class="block text-sm font-semibold text-white">{{ step.label }}</span>
                            <span class="text-xs text-zinc-500">{{ step.body }}</span>
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-12 space-y-10">
        <h2 class="text-center text-3xl font-semibold tracking-tight text-white">Everything you need to succeed</h2>
        <div class="grid gap-5 md:grid-cols-4">
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
            <p class="mt-3 text-lg text-zinc-400">Open a seller workspace and manage listings, orders, and inventory from one place.</p>
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
      body: 'Reach buyers across categories with a cleaner product workflow.'
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
    { icon: 'circle-dollar', label: 'Revenue', detail: 'Sales, refunds, and payouts' },
    { icon: 'receipt', label: 'Orders', detail: 'Open, shipped, and delivered orders' },
    { icon: 'package', label: 'Listings', detail: 'Published products and drafts' },
    { icon: 'alert-triangle', label: 'Inventory', detail: 'Low stock and replenishment' }
  ];

  readonly previewChart = [44, 62, 54, 78, 68, 88, 72, 92];

  readonly previewActivity = [
    { icon: 'receipt', label: 'Recent orders', body: 'Review fulfillment status' },
    { icon: 'package', label: 'Best sellers', body: 'Compare product performance' },
    { icon: 'alert-triangle', label: 'Low stock', body: 'Plan inventory updates' }
  ];
}
