import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-sell-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="mx-auto max-w-[1680px] px-4 py-8 lg:px-8">
      <div class="grid gap-8 xl:grid-cols-[0.9fr,1.02fr] xl:items-center">
        <div class="space-y-8">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-zinc-300">
            <app-icon name="chart" [size]="16" className="text-zinc-200" />
            Built for Sellers
          </div>

          <div class="space-y-5">
            <h1 class="font-display text-6xl font-semibold tracking-tight text-white sm:text-7xl">
              Sell smarter.<br />
              Grow faster.
            </h1>
            <p class="max-w-2xl text-2xl leading-10 text-zinc-400">
              ShopFlow gives you everything you need to list, manage, and grow your business in one premium seller hub.
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

        <div class="panel-dark flex items-center justify-center p-8">
          <div class="text-center space-y-4">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <app-icon name="store" [size]="28" className="text-zinc-100" />
            </div>
            <h3 class="text-2xl font-semibold text-white">Your seller dashboard</h3>
            <p class="text-zinc-400 max-w-md">
              Access real-time metrics, manage orders, and grow your store from one place.
            </p>
            <button type="button" (click)="onStartSelling()" class="button-secondary w-full justify-center mt-4">
              Preview Dashboard
            </button>
          </div>
        </div>
      </div>

      <div class="mt-12 space-y-10">
        <h2 class="text-center text-5xl font-semibold tracking-tight text-white">Everything you need to succeed</h2>
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
            <h3 class="text-5xl font-semibold tracking-tight text-white">Ready to grow your business?</h3>
            <p class="mt-3 text-lg text-zinc-400">Join thousands of sellers who are already earning on ShopFlow.</p>
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
    },
    {
      icon: 'headset',
      title: 'Support When You Need It',
      body: 'Our support team is here to help you grow.'
    }
  ];
}
