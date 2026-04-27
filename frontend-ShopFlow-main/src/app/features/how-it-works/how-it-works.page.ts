import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="mx-auto max-w-[1650px] px-4 py-8 lg:px-8">
      <div class="panel-dark p-8 sm:p-10 xl:p-12">
        <div class="grid gap-8 xl:grid-cols-[0.86fr,1fr] xl:items-center">
          <div class="space-y-6">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">How ShopFlow Works</p>
            <h1 class="font-display text-6xl font-semibold tracking-tight text-white sm:text-7xl">
              Shop better.<br />
              Sell faster.
            </h1>
            <p class="max-w-2xl text-xl leading-9 text-zinc-400">
              From discovery to delivery, ShopFlow keeps every step clear, fast, and premium for buyers and sellers.
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            @for (track of tracks; track track.title) {
              <div class="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">{{ track.eyebrow }}</p>
                <h2 class="mt-4 text-3xl font-semibold text-white">{{ track.title }}</h2>
                <p class="mt-3 text-base leading-8 text-zinc-400">{{ track.body }}</p>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="mt-10 grid gap-6 lg:grid-cols-3">
        @for (column of columns; track column.title) {
          <article class="panel-dark p-6 sm:p-7">
            <div class="flex items-center gap-4">
              <span class="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                <app-icon [name]="column.icon" [size]="22" className="text-zinc-100" />
              </span>
              <div>
                <p class="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">{{ column.eyebrow }}</p>
                <h2 class="text-3xl font-semibold text-white">{{ column.title }}</h2>
              </div>
            </div>

            <div class="mt-7 space-y-5">
              @for (step of column.steps; track step.title) {
                <div class="rounded-[22px] border border-white/8 bg-black/35 p-5">
                  <p class="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ step.index }}</p>
                  <h3 class="mt-3 text-2xl font-semibold text-white">{{ step.title }}</h3>
                  <p class="mt-2 text-base leading-7 text-zinc-400">{{ step.body }}</p>
                </div>
              }
            </div>
          </article>
        }
      </div>

      <div class="panel-dark mt-10 flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
        <div>
          <h3 class="text-4xl font-semibold tracking-tight text-white">Ready to get started?</h3>
          <p class="mt-2 text-lg text-zinc-400">Browse products or create your seller account and start listing today.</p>
        </div>
        <div class="flex flex-wrap gap-4">
          <a routerLink="/browse" class="button-secondary px-8">Browse Products</a>
          <button type="button" (click)="onStartSelling()" class="button-primary px-8">
            Start Selling
          </button>
        </div>
      </div>
    </section>
  `
})
export class HowItWorksPageComponent {
  private readonly navigation = inject(NavigationService);

  onStartSelling(): void {
    this.navigation.navigateToSelling();
  }

  readonly tracks = [
    {
      eyebrow: 'For Buyers',
      title: 'Discover products from trusted sellers',
      body: 'Browse categories, compare products, save favorites, and move through secure checkout with confidence.'
    },
    {
      eyebrow: 'For Sellers',
      title: 'List, manage, and grow in one place',
      body: 'Build your storefront, publish listings, follow orders, and stay on top of inventory from the seller hub.'
    }
  ];

  readonly columns = [
    {
      eyebrow: 'Browse',
      title: 'Find the right products',
      icon: 'search',
      steps: [
        { index: '01', title: 'Explore categories', body: 'Browse products by category, filters, and best-selling picks.' },
        { index: '02', title: 'Review details', body: 'Inspect gallery views, seller information, reviews, and shipping terms.' },
        { index: '03', title: 'Checkout securely', body: 'Complete your order with a smooth, structured checkout flow.' }
      ]
    },
    {
      eyebrow: 'Track',
      title: 'Stay updated after purchase',
      icon: 'package',
      steps: [
        { index: '01', title: 'View order history', body: 'See every order, status change, and next action from your account area.' },
        { index: '02', title: 'Track delivery', body: 'Follow your order from processing to delivery with clear milestones.' },
        { index: '03', title: 'Get support fast', body: 'Need help? Use built-in support actions without leaving the order view.' }
      ]
    },
    {
      eyebrow: 'Sell',
      title: 'Launch and manage your shop',
      icon: 'store',
      steps: [
        { index: '01', title: 'Create a storefront', body: 'Open your seller account and configure your workspace quickly.' },
        { index: '02', title: 'Publish listings', body: 'Add photos, details, stock, and pricing with a dense listing editor.' },
        { index: '03', title: 'Grow with insights', body: 'Use dashboard metrics and recent activity panels to keep momentum.' }
      ]
    }
  ];
}
