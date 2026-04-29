import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationService } from '../../core/services/navigation.service';
import { MarketplaceMetricsService } from '../../core/services/marketplace-metrics.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [IconComponent],
  template: `
    <section class="sf-page py-8">
      <div class="grid gap-8 xl:grid-cols-[0.82fr,1fr] xl:items-center">
        <div class="space-y-7">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">About ShopFlow</p>
          <div class="space-y-5">
            <h1 class="font-display text-6xl font-semibold tracking-tight text-white sm:text-7xl">
              Empowering buyers.<br />
              Enabling sellers.
            </h1>
            <p class="max-w-2xl text-xl leading-9 text-zinc-400">
              ShopFlow is a modern marketplace built to make buying and selling simple, secure, and smarter. Whether
              you're discovering great products or growing your brand, we give you the tools and trust you need to
              succeed.
            </p>
          </div>
          <button type="button" (click)="onStartSelling()" class="button-primary px-8">
            Start Selling
            <app-icon name="arrow-right" [size]="18" className="text-black" />
          </button>
        </div>

        <div
          class="panel-dark min-h-[380px] overflow-hidden grayscale"
          style="background:
            linear-gradient(180deg, rgba(0,0,0,.2), rgba(0,0,0,.72)),
            url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80') center / cover;"
        ></div>
      </div>

      <div class="mt-8 grid gap-5 border-y border-white/10 py-7 sm:grid-cols-2 lg:grid-cols-4">
        @for (stat of stats(); track stat.label) {
          <div class="flex items-center gap-4 border-white/10 lg:border-r lg:last:border-r-0">
            <app-icon [name]="stat.icon" [size]="34" className="text-zinc-500" />
            <div>
              <p class="text-3xl font-semibold text-white">{{ stat.value }}</p>
              <p class="text-sm text-zinc-400">{{ stat.label }}</p>
            </div>
          </div>
        }
      </div>

      <div class="mt-12 grid gap-8 xl:grid-cols-[1fr,0.58fr]">
        <div>
          <h2 class="text-5xl font-semibold tracking-tight text-white">Our Values</h2>
        </div>
        <p class="text-lg leading-8 text-zinc-400">
          Everything we do is guided by our core values. They shape our decisions, drive innovation, and define our
          commitment to buyers and sellers.
        </p>
      </div>

      <div class="mt-8 grid gap-5 lg:grid-cols-5">
        @for (value of values; track value.title) {
          <article class="panel-dark p-6">
            <span class="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <app-icon [name]="value.icon" [size]="20" className="text-zinc-100" />
            </span>
            <h3 class="mt-6 text-3xl font-semibold text-white">{{ value.title }}</h3>
            <p class="mt-4 text-base leading-8 text-zinc-400">{{ value.body }}</p>
          </article>
        }
      </div>

      <div class="panel-dark mt-8 flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
        <div class="flex items-start gap-4">
          <span class="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <app-icon name="chart" [size]="24" className="text-zinc-100" />
          </span>
          <div>
            <h3 class="text-4xl font-semibold tracking-tight text-white">Join thousands of successful sellers on ShopFlow</h3>
            <p class="mt-2 text-lg text-zinc-400">Start your journey today and take your business to the next level.</p>
          </div>
        </div>
        <button type="button" (click)="onStartSelling()" class="button-primary px-8">
          Create Your Seller Account
          <app-icon name="arrow-right" [size]="18" className="text-black" />
        </button>
      </div>
    </section>
  `
})
export class AboutPageComponent {
  private readonly navigation = inject(NavigationService);
  private readonly metricsService = inject(MarketplaceMetricsService);
  private readonly metrics = toSignal(this.metricsService.getSnapshot(), {
    initialValue: {
      totalProducts: null,
      totalCategories: null,
      promotedProducts: null,
      topSellingProducts: null
    }
  });

  onStartSelling(): void {
    this.navigation.navigateToSelling();
  }

  readonly values = [
    {
      icon: 'shield',
      title: 'Trust First',
      body: 'We build trust through secure transactions, transparent policies, and reliable order records.'
    },
    {
      icon: 'sparkles',
      title: 'Simplicity',
      body: 'Powerful commerce tools should feel smooth and easy to use for everyone.'
    },
    {
      icon: 'chart',
      title: 'Empowerment',
      body: 'We help sellers grow their business and buyers discover products that fit their lives.'
    },
    {
      icon: 'globe',
      title: 'Community',
      body: 'We are building a global community where opportunity and connection thrive.'
    },
    {
      icon: 'lock',
      title: 'Security',
      body: 'We protect your data and transactions with industry-leading security standards.'
    }
  ];

  readonly stats = computed(() => {
    const metrics = this.metrics();
    return [
      { icon: 'bag', value: this.formatMetric(metrics.totalProducts), label: 'Active Products' },
      { icon: 'grid', value: this.formatMetric(metrics.totalCategories), label: 'Categories' },
      { icon: 'badge-percent', value: this.formatMetric(metrics.promotedProducts), label: 'Promotions' },
      { icon: 'star', value: this.formatMetric(metrics.topSellingProducts), label: 'Top Selling Picks' }
    ];
  });

  private formatMetric(value: number | null): string {
    return value === null ? 'Unavailable' : value.toLocaleString('en-US');
  }
}
