import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <section class="mx-auto max-w-[1700px] border-x border-white/8 bg-black">
      <div class="grid min-h-[78vh] grid-cols-1 border-b border-white/8 lg:grid-cols-[1.08fr_0.92fr]">
        <div class="relative overflow-hidden border-r border-white/8 px-7 pb-8 pt-12 sm:px-10 lg:px-12 lg:pt-16">
          <div class="pointer-events-none absolute inset-0 opacity-[0.14]" style="background-image: linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 44px 44px;"></div>

          <div class="relative z-10 max-w-[680px] space-y-6">
            <h1 class="font-display text-[4.3rem] font-semibold uppercase leading-[0.9] tracking-[-0.03em] text-white sm:text-[5.6rem] lg:text-[7rem]">
              Buy. Sell.
              <br />
              Let it flow.
            </h1>

            <p class="max-w-[360px] text-lg leading-8 text-zinc-400">
              Shopflow is the modern marketplace for buyers and sellers.
              <br />
              Simple, secure, and built to scale.
            </p>

            <div class="flex flex-wrap gap-3 pt-2">
              <a routerLink="/browse" class="button-primary min-w-[138px] justify-center px-6">
                Shop Now
                <app-icon name="arrow-right" [size]="16" className="text-black" />
              </a>
              <button type="button" (click)="onStartSelling()" class="button-secondary min-w-[138px] justify-center px-6">
                Start Selling
                <app-icon name="arrow-right" [size]="16" className="text-zinc-100" />
              </button>
            </div>

            <div class="grid max-w-[520px] grid-cols-2 gap-5 border-t border-white/8 pt-7 sm:grid-cols-4">
              @for (stat of stats; track stat.label) {
                <div>
                  <p class="text-[1.85rem] font-semibold tracking-tight text-white">{{ stat.value }}</p>
                  <p class="mt-1 text-xs text-zinc-500">{{ stat.label }}</p>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="grid min-h-[450px] grid-cols-3">
          @for (panel of panels; track panel.eyebrow) {
            <article class="group relative overflow-hidden border-l border-white/8">
              <img
                [src]="panel.image"
                [alt]="panel.eyebrow"
                class="absolute inset-0 h-full w-full object-cover grayscale"
              />
              <div class="absolute inset-0 bg-black/55 transition duration-500 group-hover:bg-black/42"></div>
              <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.8)_100%)]"></div>

              <div class="relative z-10 p-5 pt-16 xl:p-7">
                <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{{ panel.eyebrow }}</p>
                <p class="mt-3 max-w-[220px] text-sm leading-6 text-zinc-200">{{ panel.copy }}</p>
                <a [routerLink]="panel.route" class="mt-6 inline-flex text-zinc-300 transition hover:text-white">
                  <app-icon name="arrow-right" [size]="16" />
                </a>
              </div>
            </article>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        @for (feature of features; track feature.title) {
          <div class="flex items-start gap-4 border-b border-r border-white/8 px-6 py-5 lg:border-b-0">
            <app-icon [name]="feature.icon" [size]="18" className="mt-1 text-zinc-300" />
            <div>
              <p class="text-base font-semibold text-white">{{ feature.title }}</p>
              <p class="mt-1 text-sm leading-6 text-zinc-500">{{ feature.copy }}</p>
            </div>
          </div>
        }
      </div>
    </section>
  `
})
export class HomePageComponent {
  private readonly navigation = inject(NavigationService);

  onStartSelling(): void {
    this.navigation.navigateToSelling();
  }

  readonly panels = [
    {
      eyebrow: 'For Buyers',
      copy: 'Discover products you love and shop with confidence.',
      route: '/browse',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
    },
    {
      eyebrow: 'For Sellers',
      copy: 'List products, grow your brand, and reach more buyers.',
      route: '/sell',
      image: 'https://images.unsplash.com/photo-1522204538344-922f76ecc041?auto=format&fit=crop&w=1200&q=80'
    },
    {
      eyebrow: 'Shopflow',
      copy: 'Built for modern commerce with speed, trust, and scale.',
      route: '/categories',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  readonly stats = [
    { value: '10K+', label: 'Active Listings' },
    { value: '25K+', label: 'Happy Users' },
    { value: '99%', label: 'Positive Reviews' },
    { value: 'Worldwide', label: 'Community' }
  ];

  readonly features = [
    {
      icon: 'shield-check',
      title: 'Secure & Trusted',
      copy: 'Every transaction is protected.'
    },
    {
      icon: 'tag',
      title: 'Easy to Buy',
      copy: 'Find what you need and checkout with ease.'
    },
    {
      icon: 'store',
      title: 'Easy to Sell',
      copy: 'List in minutes and reach more buyers.'
    },
    {
      icon: 'chart',
      title: 'Powerful Tools',
      copy: 'Everything you need to grow your business.'
    }
  ];
}
