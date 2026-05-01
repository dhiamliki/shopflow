import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { SessionService } from '../../core/services/session.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    ProductCardComponent,
  ],
  template: `
    @if (product(); as p) {
      <section class="sf-page py-12">
        <nav class="mb-10 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          @for (crumb of breadcrumbs(); track crumb.label) {
            @if (crumb.route) {
              <a [routerLink]="crumb.route" class="hover:text-white">{{ crumb.label }}</a>
            } @else {
              <span class="text-zinc-300">{{ crumb.label }}</span>
            }
            @if (!$last) {
              <span>&rsaquo;</span>
            }
          }
        </nav>

        <div class="product-detail-grid">
          <section class="min-w-0 space-y-6">
            <!-- Main image -->
            <div class="panel-dark overflow-hidden p-3 sm:p-4">
              <div
                class="sf-product-gallery-stage relative aspect-square w-full overflow-hidden rounded-md border border-white/8"
              >
                @if (selectedImage()) {
                  <img class="sf-product-detail-image" [src]="selectedImage()" [alt]="p.name" />
                } @else {
                  <div class="flex h-full items-center justify-center">
                    <app-icon name="bag" [size]="36" className="text-zinc-500" />
                  </div>
                }

                @if (galleryImages().length > 1) {
                  <button
                    type="button"
                    class="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-sm transition hover:bg-black/80"
                    (click)="stepImage(-1)"
                  >
                    <app-icon name="chevron-left" [size]="17" className="text-white" />
                  </button>
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-sm transition hover:bg-black/80"
                    (click)="stepImage(1)"
                  >
                    <app-icon name="chevron-right" [size]="17" className="text-white" />
                  </button>
                }
              </div>
            </div>

            <!-- Horizontal thumbnail strip -->
            @if (galleryImages().length > 1) {
              <div class="product-detail__thumbs flex gap-4 overflow-x-auto pb-1">
                @for (image of galleryImages(); track image; let imageIndex = $index) {
                  <button
                    type="button"
                    class="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-md border bg-[#f6f4ef] transition"
                    [ngClass]="
                      selectedImageIndex() === imageIndex
                        ? 'border-white/30 ring-1 ring-white/15'
                        : 'border-white/8 hover:border-white/20'
                    "
                    (click)="selectedImageIndex.set(imageIndex)"
                  >
                    <img
                      class="sf-product-thumb-image"
                      [src]="image"
                      [alt]="p.name"
                      loading="lazy"
                    />
                  </button>
                }
              </div>
            }
          </section>

          <section class="product-detail-copy space-y-10 lg:pt-2">
            <div class="space-y-7">
              <span
                class="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300"
              >
                {{ p.categories[0] || 'Featured' }}
              </span>

              <div class="space-y-6">
                <h1
                  class="font-display text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl"
                >
                  {{ p.name }}
                </h1>

                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
                  <div class="flex items-center gap-2 text-white">
                    <span class="flex items-center gap-1 text-amber-300">
                      @for (star of ratingStars; track star) {
                        <app-icon name="star" [size]="15" className="text-amber-300" />
                      }
                    </span>
                    <span>{{ p.averageRating | number: '1.1-1' }}</span>
                  </div>
                  <span>({{ reviewCount() }} reviews)</span>
                  <span>&bull;</span>
                  <span>{{ soldCount() }} sold</span>
                </div>

                <div class="flex flex-wrap items-end gap-x-4 gap-y-2">
                  <p class="text-4xl font-semibold leading-none tracking-tight text-white xl:text-5xl">
                    {{ p.effectivePrice | currency: 'USD' : 'symbol' : '1.0-0' }}
                  </p>
                  @if (p.promoPrice) {
                    <p class="text-xl text-zinc-500 line-through">
                      {{ p.price | currency: 'USD' : 'symbol' : '1.0-0' }}
                    </p>
                    <span class="rounded-2xl bg-white/8 px-4 py-2 text-sm font-semibold text-white">
                      {{ discountLabel() }}
                    </span>
                  }
                </div>

                <div class="flex flex-wrap items-center gap-3 pt-1 text-base">
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                  <span class="text-emerald-300">In stock</span>
                  <span class="text-zinc-500">|</span>
                  <span class="text-zinc-400">{{ p.stock }} units available</span>
                </div>

                <p class="max-w-2xl text-lg leading-8 text-zinc-400 lg:max-w-none">
                  {{ p.description }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-2 pt-1 text-base font-semibold text-white hover:text-zinc-300"
              (click)="activeTab.set('specifications')"
            >
              View full specifications
              <app-icon name="arrow-right" [size]="18" className="text-white" />
            </button>
          </section>

          <aside class="product-detail-aside space-y-5">
            <div class="panel-dark p-7">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm text-zinc-500">Sold by</p>
                  <div class="mt-3 flex items-center gap-3">
                    <span
                      class="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
                    >
                      <app-icon name="store" [size]="19" className="text-white" />
                    </span>
                    <div>
                      <p class="text-lg font-semibold text-white">{{ p.sellerName }}</p>
                      <p class="text-sm text-zinc-400">Marketplace seller</p>
                    </div>
                  </div>
                </div>
                <a [routerLink]="['/store', p.sellerId]" class="button-secondary min-h-10 px-4 text-sm">
                  View Store
                </a>
              </div>

              <div class="mt-7 border-t border-white/8 pt-7">
                <div class="space-y-6 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-zinc-400">Price</span>
                    <span class="text-3xl font-semibold tracking-tight text-white">
                      {{ p.effectivePrice | currency: 'USD' : 'symbol' : '1.0-0' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-zinc-400">Available stock</span>
                    <span class="text-zinc-200">{{ p.stock }} units</span>
                  </div>
                </div>

                <div class="mt-7 space-y-3.5">
                  <button type="button" class="button-primary w-full" (click)="addToCart()">
                    <app-icon name="bag" [size]="18" className="text-black" />
                    Add to Cart
                  </button>
                  <button type="button" class="button-secondary w-full" (click)="buyNow()">
                    Buy Now
                  </button>
                </div>

                <div class="mt-7 rounded-md border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
                  Cart totals and shipping are calculated by the backend during checkout.
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div class="mt-16 grid gap-12 xl:grid-cols-[1.08fr,0.92fr]">
          <section class="space-y-8">
            <div class="flex flex-wrap gap-8 border-b border-white/8">
              @for (tab of tabs; track tab) {
                <button
                  type="button"
                  class="relative pb-5 text-lg font-medium transition"
                  [ngClass]="activeTab() === tab ? 'text-white' : 'text-zinc-400 hover:text-white'"
                  (click)="activeTab.set(tab)"
                >
                  {{ tabLabel(tab) }}
                  @if (activeTab() === tab) {
                    <span class="absolute inset-x-0 bottom-0 h-0.5 bg-white"></span>
                  }
                </button>
              }
            </div>

            @switch (activeTab()) {
              @case ('description') {
                <div class="space-y-6 text-base leading-8 text-zinc-400">
                  <p>{{ p.description }}</p>
                  <ul class="list-disc space-y-3 pl-6">
                    <li>Seller: {{ p.sellerName }}</li>
                    <li>Category: {{ p.categories.join(', ') }}</li>
                    <li>Available stock: {{ p.stock }} units</li>
                  </ul>
                </div>
              }
              @case ('specifications') {
                <div class="grid gap-4 md:grid-cols-2">
                  @for (spec of specificationRows(); track spec.label) {
                    <div class="panel-dark p-5">
                      <p class="text-sm text-zinc-500">{{ spec.label }}</p>
                      <p class="mt-3 text-lg font-semibold text-white">{{ spec.value }}</p>
                    </div>
                  }
                </div>
              }
              @case ('reviews') {
                <div class="space-y-4">
                  @for (review of reviewsToShow(); track review.id) {
                    <div class="panel-dark p-5">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p class="text-lg font-semibold text-white">{{ review.userName }}</p>
                          <p class="text-sm text-zinc-500">
                            {{ review.createdAt | date: 'mediumDate' }}
                          </p>
                        </div>
                        <span class="inline-flex items-center gap-1 text-amber-300">
                          @for (star of [1, 2, 3, 4, 5]; track star) {
                            <app-icon
                              name="star"
                              [size]="14"
                              [className]="
                                star <= review.rating ? 'text-amber-300' : 'text-zinc-600'
                              "
                            />
                          }
                        </span>
                      </div>
                      <p class="mt-4 text-sm leading-7 text-zinc-400">{{ review.comment }}</p>
                    </div>
                  }
                </div>
              }
            }
          </section>

          <aside class="space-y-5">
            <div>
              <h2 class="text-3xl font-semibold text-white">You may also like</h2>
              <p class="mt-2 text-sm text-zinc-400">Top-selling products from the marketplace.</p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              @for (item of relatedProducts(); track item.id) {
                <app-product-card
                  [product]="item"
                  context="compact"
                  [showSeller]="false"
                  [showActions]="false"
                />
              }
            </div>
          </aside>
        </div>
      </section>
    } @else {
      <app-empty-state
        icon="search"
        title="Product not found"
        message="This product may have been removed or the link is incorrect."
      >
        <a routerLink="/browse" class="button-primary px-8">Browse products</a>
      </app-empty-state>
    }
  `,
  styles: [
    `
      .product-detail-grid {
        display: grid;
        gap: 2.75rem;
      }

      @media (min-width: 1024px) {
        .product-detail-grid {
          grid-template-columns: minmax(280px, 1.05fr) minmax(250px, 0.82fr) minmax(250px, 320px);
          align-items: start;
          gap: 3rem;
        }

        .product-detail-aside {
          position: sticky;
          top: 7rem;
        }
      }

      @media (min-width: 1280px) {
        .product-detail-grid {
          grid-template-columns: minmax(430px, 1.05fr) minmax(360px, 0.82fr) minmax(330px, 390px);
          gap: 3.25rem;
        }
      }

      @media (min-width: 1536px) {
        .product-detail-grid {
          gap: 3.75rem;
        }
      }

      .product-detail__thumbs {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
      }

      .product-detail__thumbs::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .product-detail__thumbs::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 999px;
      }

      .product-detail__thumbs::-webkit-scrollbar-track {
        background: transparent;
      }
    `,
  ],
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly session = inject(SessionService);

  readonly selectedImageIndex = signal(0);
  readonly activeTab = signal<'description' | 'specifications' | 'reviews'>(
    'description',
  );

  readonly productId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id') ?? 0))),
    { initialValue: 0 },
  );

  readonly product = toSignal(
    toObservable(this.productId).pipe(
      switchMap((productId) => (productId ? this.catalog.getProduct(productId) : of(null))),
    ),
    { initialValue: null },
  );

  readonly relatedProducts = toSignal(
    toObservable(this.product).pipe(
      switchMap((product) =>
        product
          ? this.catalog
              .getTopSelling()
              .pipe(map((items) => items.filter((item) => item.id !== product.id).slice(0, 3)))
          : of([]),
      ),
    ),
    { initialValue: [] },
  );

  readonly selectedImage = computed(() => {
    const images = this.galleryImages();
    return images[this.selectedImageIndex()] ?? images[0] ?? '';
  });
  readonly galleryImages = computed(() => {
    const imageUrls = this.product()?.imageUrls ?? [];
    return Array.from(new Set(imageUrls.filter(Boolean)));
  });
  readonly reviewCount = computed(() => {
    const p = this.product();
    return p ? p.reviews.length : 0;
  });
  readonly soldCount = computed(() => {
    const p = this.product();
    return p ? p.salesCount : 0;
  });
  readonly discountLabel = computed(() => {
    const p = this.product();
    if (!p?.promoPrice) return '';
    const discount = 100 - (p.promoPrice / p.price) * 100;
    return `${Math.round(discount)}% OFF`;
  });
  readonly breadcrumbs = computed(() => {
    const p = this.product();
    if (!p) return [];
    return [
      { label: 'Home', route: '/' },
      { label: p.categories[0] ?? 'Category', route: '/categories' },
      { label: p.name },
    ];
  });
  readonly reviewsToShow = computed(() => this.product()?.reviews ?? []);

  readonly ratingStars = [1, 2, 3, 4, 5];
  readonly tabs = ['description', 'specifications', 'reviews'] as const;
  readonly specificationRows = computed(() => {
    const p = this.product();
    if (!p) return [];
    return [
      { label: 'Seller', value: p.sellerName },
      { label: 'Category', value: p.categories.join(', ') },
      { label: 'Available stock', value: `${p.stock} units` },
      {
        label: 'Variants',
        value:
          p.variants
            .map((variant) => `${variant.attributeName}: ${variant.attributeValue}`)
            .join(' | ') || 'Standard',
      },
    ];
  });

  constructor() {
    effect(() => {
      this.selectedImageIndex.set(0);
    });
  }

  stepImage(direction: number): void {
    const images = this.galleryImages();
    if (!images.length) return;
    const next = (this.selectedImageIndex() + direction + images.length) % images.length;
    this.selectedImageIndex.set(next);
  }

  addToCart(): void {
    if (!this.session.isCustomer()) {
      void this.router.navigate(['/login'], {
        queryParams: {
          redirect: this.router.url,
        },
      });
      return;
    }

    const p = this.product();
    if (!p) return;

    this.cartService
      .addItem({
        productId: p.id,
        variantId: p.variants[0]?.id ?? null,
        quantity: 1,
      })
      .subscribe();
  }

  buyNow(): void {
    this.addToCart();
    if (this.session.isCustomer()) {
      void this.router.navigateByUrl('/checkout');
    }
  }

  tabLabel(tab: 'description' | 'specifications' | 'reviews'): string {
    switch (tab) {
      case 'description':
        return 'Description';
      case 'specifications':
        return 'Specifications';
      case 'reviews':
        return `Reviews (${this.reviewCount()})`;
    }
  }
}
