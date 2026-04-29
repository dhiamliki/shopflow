import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap, of } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { SessionService } from '../../core/services/session.service';
import { WorkspaceService } from '../../core/services/workspace.service';
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
      <section class="sf-page py-8">
        <nav class="mb-7 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
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

        <div
          class="grid gap-7 xl:grid-cols-[minmax(0,720px),minmax(340px,1fr),300px] xl:items-start 2xl:grid-cols-[minmax(0,760px),minmax(380px,1fr),340px]"
        >
          <section class="min-w-0">
            <div class="grid gap-4 md:grid-cols-[88px,minmax(0,1fr)] md:items-start">
              <div
                class="product-detail__thumbs order-2 flex gap-3 overflow-x-auto pb-1 md:order-1 md:max-h-[700px] md:flex-col md:overflow-y-auto md:pb-0 md:pr-1"
              >
                @for (image of galleryImages(); track image; let imageIndex = $index) {
                  <button
                    type="button"
                    class="h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-zinc-950/80 transition md:h-[88px] md:w-[88px]"
                    [ngClass]="
                      selectedImageIndex() === imageIndex
                        ? 'border-white/30 ring-1 ring-white/15'
                        : 'border-white/8 hover:border-white/14'
                    "
                    (click)="selectedImageIndex.set(imageIndex)"
                  >
                    <img
                      class="sf-product-thumb-image h-full w-full"
                      [src]="image"
                      [alt]="p.name"
                      loading="lazy"
                    />
                  </button>
                }
              </div>

              <div class="panel-dark order-1 overflow-hidden p-2 sm:p-3 md:order-2">
                <div
                  class="sf-product-gallery-stage relative h-[440px] overflow-hidden rounded-md border border-white/8 sm:h-[520px] lg:h-[620px] xl:h-[700px]"
                >
                  @if (selectedImage()) {
                    <img
                      class="sf-product-detail-image h-full w-full"
                      [src]="selectedImage()"
                      [alt]="p.name"
                    />
                  } @else {
                    <div class="flex h-full items-center justify-center">
                      <app-icon name="bag" [size]="36" className="text-zinc-500" />
                    </div>
                  }

                  @if (galleryImages().length > 1) {
                    <button
                      type="button"
                      class="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 transition hover:bg-black/70"
                      (click)="stepImage(-1)"
                    >
                      <app-icon name="chevron-left" [size]="18" className="text-white" />
                    </button>
                    <button
                      type="button"
                      class="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/50 transition hover:bg-black/70"
                      (click)="stepImage(1)"
                    >
                      <app-icon name="chevron-right" [size]="18" className="text-white" />
                    </button>
                  }
                </div>
              </div>
            </div>
          </section>

          <section class="space-y-6 xl:pl-2">
            <div class="space-y-4">
              <span
                class="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300"
              >
                {{ p.categories[0] || 'Featured' }}
              </span>

              <div class="space-y-4">
                <h1
                  class="font-display text-4xl font-semibold tracking-tight text-white xl:text-5xl"
                >
                  {{ p.name }}
                </h1>

                <div class="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
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

                <div class="flex flex-wrap items-center gap-4">
                  <p class="text-4xl font-semibold tracking-tight text-white xl:text-5xl">
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

                <div class="flex items-center gap-3 text-base">
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                  <span class="text-emerald-300">In stock</span>
                  <span class="text-zinc-500">|</span>
                  <span class="text-zinc-400">Free shipping</span>
                </div>

                <p class="max-w-2xl text-lg leading-8 text-zinc-400">
                  {{ p.description }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="inline-flex items-center gap-2 text-base font-semibold text-white hover:text-zinc-300"
            >
              View full specifications
              <app-icon name="arrow-right" [size]="18" className="text-white" />
            </button>
          </section>

          <aside class="space-y-4 xl:sticky xl:top-28">
            <div class="panel-dark p-5">
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
                <button type="button" class="button-secondary min-h-10 px-4 text-sm">
                  View Store
                </button>
              </div>

              <div class="mt-5 border-t border-white/8 pt-5">
                <div class="space-y-4 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-zinc-400">Price</span>
                    <span class="text-3xl font-semibold tracking-tight text-white">
                      {{ p.effectivePrice | currency: 'USD' : 'symbol' : '1.0-0' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-zinc-400">Shipping</span>
                    <span class="text-emerald-300">Free</span>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <span class="text-zinc-400">Delivery</span>
                    <span class="text-right text-zinc-200"
                      >Est. delivery {{ estimatedDelivery() }}</span
                    >
                  </div>
                </div>

                <div class="mt-5 space-y-3">
                  <button type="button" class="button-primary w-full" (click)="addToCart()">
                    <app-icon name="bag" [size]="18" className="text-black" />
                    Add to Cart
                  </button>
                  <button type="button" class="button-secondary w-full" (click)="buyNow()">
                    Buy Now
                  </button>
                </div>

                <div
                  class="mt-5 flex items-center justify-between border-y border-white/8 py-4 text-sm"
                >
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 text-zinc-300 hover:text-white"
                    (click)="toggleWishlist()"
                  >
                    <app-icon
                      name="heart"
                      [size]="17"
                      [className]="wishlisted() ? 'text-rose-400' : 'text-zinc-300'"
                    />
                    Add to Wishlist
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 text-zinc-300 hover:text-white"
                  >
                    <app-icon name="share" [size]="17" className="text-zinc-300" />
                    Share
                  </button>
                </div>

                <div class="mt-5 space-y-4">
                  <h3 class="text-lg font-semibold text-white">Shop with confidence</h3>
                  @for (trust of trustPoints; track trust.title) {
                    <div class="flex items-start gap-3">
                      <span
                        class="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"
                      >
                        <app-icon [name]="trust.icon" [size]="16" className="text-zinc-200" />
                      </span>
                      <div>
                        <p class="text-sm font-semibold text-white">{{ trust.title }}</p>
                        <p class="text-sm leading-6 text-zinc-400">{{ trust.body }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div class="mt-12 grid gap-10 xl:grid-cols-[1.1fr,0.95fr]">
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
              @case ('shipping') {
                <div class="grid gap-4 md:grid-cols-3">
                  @for (policy of trustPoints; track policy.title) {
                    <div class="panel-dark p-5">
                      <app-icon [name]="policy.icon" [size]="20" className="text-zinc-100" />
                      <p class="mt-4 text-lg font-semibold text-white">{{ policy.title }}</p>
                      <p class="mt-2 text-sm leading-6 text-zinc-400">{{ policy.body }}</p>
                    </div>
                  }
                </div>
              }
            }
          </section>

          <aside class="space-y-5">
            <div class="flex items-center justify-between">
              <h2 class="text-3xl font-semibold text-white">You may also like</h2>
              <div class="flex gap-2">
                <button type="button" class="icon-button">
                  <app-icon name="chevron-left" [size]="18" className="text-zinc-200" />
                </button>
                <button type="button" class="icon-button">
                  <app-icon name="chevron-right" [size]="18" className="text-zinc-200" />
                </button>
              </div>
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
  private readonly workspace = inject(WorkspaceService);

  readonly selectedImageIndex = signal(0);
  readonly activeTab = signal<'description' | 'specifications' | 'reviews' | 'shipping'>(
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
  readonly galleryImages = computed(() =>
    this.product()?.imageUrls?.length ? this.product()!.imageUrls : [],
  );
  readonly wishlisted = computed(() => {
    const product = this.product();
    return product ? this.workspace.isInWishlist(product.id) : false;
  });
  readonly reviewCount = computed(() => {
    const p = this.product();
    return p ? p.reviews.length : 0;
  });
  readonly soldCount = computed(() => {
    const p = this.product();
    return p ? p.salesCount : 0;
  });
  readonly estimatedDelivery = computed(() => {
    const start = new Date();
    const end = new Date();
    start.setDate(start.getDate() + 2);
    end.setDate(end.getDate() + 4);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
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
  readonly tabs = ['description', 'specifications', 'reviews', 'shipping'] as const;
  readonly trustPoints = [
    {
      icon: 'shield-check',
      title: 'Secure Payments',
      body: 'Your payment information is safe and encrypted.',
    },
    {
      icon: 'arrow-left',
      title: '30-Day Returns',
      body: 'Easy returns on eligible items if it is not the right fit.',
    },
  ];
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
      void this.router.navigate(['/auth'], {
        queryParams: {
          mode: 'login',
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

  toggleWishlist(): void {
    if (!this.session.isCustomer()) {
      void this.router.navigate(['/login'], {
        queryParams: {
          redirect: this.router.url,
        },
      });
      return;
    }

    const p = this.product();
    if (p) {
      this.workspace.toggleWishlist(p);
    }
  }

  tabLabel(tab: 'description' | 'specifications' | 'reviews' | 'shipping'): string {
    switch (tab) {
      case 'description':
        return 'Description';
      case 'specifications':
        return 'Specifications';
      case 'reviews':
        return `Reviews (${this.reviewCount()})`;
      case 'shipping':
        return 'Shipping & Returns';
    }
  }
}
