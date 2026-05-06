import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-store-page',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink, EmptyStateComponent, IconComponent, ProductCardComponent],
  template: `
    @if (store(); as sellerStore) {
      <section class="sf-page py-8">
        <nav class="mb-7 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <a routerLink="/browse" class="hover:text-white">Browse</a>
          <span>&rsaquo;</span>
          <span class="text-zinc-300">{{ sellerStore.shopName }}</span>
        </nav>

        <header class="panel-dark overflow-hidden">
          <div class="grid gap-6 p-6 md:grid-cols-[auto,1fr] md:items-center lg:p-8">
            <div class="flex h-24 w-24 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] md:h-28 md:w-28">
              @if (sellerStore.logoUrl) {
                <img
                  class="h-full w-full rounded-md object-cover"
                  [src]="sellerStore.logoUrl"
                  [alt]="sellerStore.shopName"
                />
              } @else {
                <app-icon name="store" [size]="34" className="text-white" />
              }
            </div>

            <div class="min-w-0 space-y-5">
              <div class="space-y-2">
                <p class="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Marketplace store
                </p>
                <h1 class="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {{ sellerStore.shopName }}
                </h1>
                <p class="max-w-3xl text-base leading-7 text-zinc-400">
                  {{ sellerStore.description || 'Products from ' + sellerStore.sellerName }}
                </p>
              </div>

              <div class="flex flex-wrap gap-3 text-sm">
                <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300">
                  <app-icon name="star" [size]="15" className="text-amber-300" />
                  {{ sellerStore.rating | number: '1.1-1' }}
                </span>
                <span class="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300">
                  {{ sellerStore.activeProductCount }} active listings
                </span>
                <span class="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300">
                  Seller: {{ sellerStore.sellerName }}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div class="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 class="text-3xl font-semibold text-white">Store listings</h2>
            <p class="mt-2 text-zinc-400">Products currently published by this seller.</p>
          </div>
          <a
            routerLink="/browse"
            [queryParams]="{ sellerId: sellerStore.sellerId }"
            class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white"
          >
            Browse all
            <app-icon name="arrow-right" [size]="16" className="text-zinc-300" />
          </a>
        </div>

        @if (products().length) {
          <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            }
          </div>
        } @else {
          <div class="mt-6">
            <app-empty-state
              icon="package"
              title="No active listings"
              message="This seller does not have active products right now."
            />
          </div>
        }
      </section>
    } @else {
      <app-empty-state
        icon="store"
        title="Store not found"
        message="This seller profile is unavailable or no longer active."
      >
        <a routerLink="/browse" class="button-primary px-8">Browse products</a>
      </app-empty-state>
    }
  `,
})
export class StorePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);

  readonly sellerId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('sellerId') ?? 0))),
    { initialValue: 0 },
  );

  readonly store = toSignal(
    toObservable(this.sellerId).pipe(
      switchMap((sellerId) => (sellerId ? this.catalog.getStore(sellerId) : of(null))),
    ),
    { initialValue: null },
  );

  readonly productsPage = toSignal(
    toObservable(this.sellerId).pipe(
      switchMap((sellerId) =>
        sellerId
          ? this.catalog.listProducts({ sellerId, page: 0, size: 12, sortBy: 'newest' })
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  readonly products = computed(() => this.productsPage()?.content ?? []);
}
