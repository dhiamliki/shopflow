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
      <div class="grid gap-8 xl:grid-cols-[0.82fr,1.18fr] xl:items-center">
        <div class="space-y-8">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300">
            <app-icon name="chart" [size]="16" className="text-zinc-200" />
            Built for Sellers
          </div>

          <div class="space-y-5">
            <h1 class="font-display text-6xl font-semibold tracking-[-0.06em] text-white sm:text-7xl">
              Open your<br />
              Shopflow store.
            </h1>
            <p class="max-w-2xl text-2xl leading-10 text-zinc-400">
              Create a seller account, publish products, and manage real store activity from your seller dashboard.
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

        <div class="panel-dark p-6 sm:p-8">
          <div class="space-y-6">
            @for (step of sellerFlow; track step.title) {
              <div class="grid gap-4 border-b border-white/8 pb-6 last:border-b-0 last:pb-0 sm:grid-cols-[auto,1fr]">
                <span class="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                  <app-icon [name]="step.icon" [size]="20" className="text-white" />
                </span>
                <div>
                  <p class="text-xl font-semibold text-white">{{ step.title }}</p>
                  <p class="mt-2 text-sm leading-7 text-zinc-400">{{ step.body }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="mt-12 space-y-10">
        <h2 class="text-center text-3xl font-semibold tracking-tight text-white">Seller tools currently available</h2>
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
            <p class="mt-3 text-lg text-zinc-400">Create a seller workspace and manage listings, orders, and inventory from one place.</p>
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
      title: 'Product Listings',
      body: 'Create products with categories, images, variants, price, promotions, and stock.'
    },
    {
      icon: 'store',
      title: 'Public Storefront',
      body: 'Products link back to a seller store page using your real shop profile.'
    },
    {
      icon: 'chart',
      title: 'Seller Dashboard',
      body: 'Review store totals for products, orders, revenue, pending orders, and low stock.'
    }
  ];

  readonly benefits = [
    {
      icon: 'sparkles',
      title: 'Seller Setup',
      body: 'Create your seller account and start listing in just a few steps.'
    },
    {
      icon: 'briefcase',
      title: 'Inventory Controls',
      body: 'Track product stock and low-stock products from the seller dashboard.'
    },
    {
      icon: 'receipt',
      title: 'Order Visibility',
      body: 'See recent seller orders from real order data.'
    },
    {
      icon: 'store',
      title: 'Store Page',
      body: 'Customers can open your public store from product pages.'
    }
  ];

  readonly sellerFlow = [
    {
      icon: 'user',
      title: 'Create a seller account',
      body: 'Register as a seller or complete seller onboarding with a shop name and description.'
    },
    {
      icon: 'package',
      title: 'Publish products',
      body: 'Use the create listing page to save products directly to your store.'
    },
    {
      icon: 'dashboard',
      title: 'Manage store activity',
      body: 'Use the seller dashboard for revenue, orders, listings, top products, recent orders, and low-stock data.'
    }
  ];
}
