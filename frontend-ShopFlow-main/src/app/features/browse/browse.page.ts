import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, debounceTime, map, startWith, switchMap } from 'rxjs';
import { Category, PageResponse, Product } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { CategoriesService } from '../../core/services/categories.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';

@Component({
  selector: 'app-browse-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmptyStateComponent,
    IconComponent,
    PanelCardComponent,
    ProductCardComponent,
    SectionHeadingComponent
  ],
  template: `
    <section class="mx-auto max-w-[1700px] px-4 py-6 lg:px-8">
      <app-section-heading
        title="Browse Products"
        subtitle="Explore thousands of products from trusted sellers across every category."
      />

      <!-- Horizontal Category Navigation -->
      <div class="mt-6 overflow-x-auto">
        <div class="flex gap-3 pb-2">
          <button
            type="button"
            class="shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition"
            [ngClass]="
              filtersForm.controls.categoryId.value === 0
                ? 'border-emerald-400/25 bg-emerald-500/12 text-white'
                : 'border-white/8 bg-white/[0.02] text-zinc-300 hover:border-white/14 hover:bg-white/[0.04]'
            "
            (click)="filtersForm.patchValue({ categoryId: 0 })"
          >
            All Categories
          </button>
          @for (category of flatCategories(); track category.id) {
            <button
              type="button"
              class="shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition"
              [ngClass]="
                filtersForm.controls.categoryId.value === category.id
                  ? 'border-emerald-400/25 bg-emerald-500/12 text-white'
                  : 'border-white/8 bg-white/[0.02] text-zinc-300 hover:border-white/14 hover:bg-white/[0.04]'
              "
              (click)="filtersForm.patchValue({ categoryId: category.id })"
            >
              {{ category.name }}
            </button>
          }
        </div>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-[280px,1fr]">
        <!-- Sidebar: Functional Filters Only -->
        <aside class="space-y-4">
          <div class="sticky top-28 space-y-4">
            <app-panel-card className="p-0">
              <div class="border-b border-white/8 px-5 py-5">
                <div class="flex items-center justify-between">
                  <h2 class="text-2xl font-semibold text-white">Filters</h2>
                  <button type="button" class="text-sm font-medium text-zinc-400 hover:text-white" (click)="clearFilters()">
                    Clear all
                  </button>
                </div>
              </div>

              <div class="space-y-7 px-5 py-6">
                <!-- Price Range -->
                <section class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Price Range
                    </h3>
                    <app-icon name="chevron-down" [size]="16" className="text-zinc-500" />
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <label class="space-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Min
                      <input type="number" class="input-dark" formControlName="minPrice" />
                    </label>
                    <label class="space-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Max
                      <input type="number" class="input-dark" formControlName="maxPrice" />
                    </label>
                  </div>
                </section>

                <!-- Promo Filter -->
                <section class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Offers
                    </h3>
                    <app-icon name="chevron-down" [size]="16" className="text-zinc-500" />
                  </div>
                  <label
                    class="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300"
                  >
                    <input type="checkbox" class="accent-emerald-400" formControlName="promo" />
                    Only show promotional prices
                  </label>
                </section>
              </div>
            </app-panel-card>
          </div>
        </aside>

        <section class="space-y-6">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div class="panel-dark flex flex-1 items-center gap-3 px-4 py-3.5">
              <app-icon name="search" [size]="18" className="text-zinc-500" />
              <input
                formControlName="search"
                type="text"
                placeholder="Search products, brands or categories..."
                class="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div class="flex gap-3">
              <label class="panel-dark flex min-w-[220px] items-center gap-3 px-4 py-3.5 text-sm text-zinc-300">
                <span>Sort by:</span>
                <select class="w-full bg-transparent text-right text-white outline-none" formControlName="sortBy">
                  <option value="newest">Newest</option>
                  <option value="popularity">Most Popular</option>
                  <option value="price">Price</option>
                </select>
              </label>

              <div class="panel-dark flex items-center gap-2 px-2 py-2">
                <button
                  type="button"
                  class="icon-button"
                  [ngClass]="viewMode() === 'grid' ? 'border-white/16 bg-white/7' : ''"
                  (click)="viewMode.set('grid')"
                >
                  <app-icon name="grid" [size]="18" className="text-zinc-200" />
                </button>
                <button
                  type="button"
                  class="icon-button"
                  [ngClass]="viewMode() === 'compact' ? 'border-white/16 bg-white/7' : ''"
                  (click)="viewMode.set('compact')"
                >
                  <app-icon name="list" [size]="18" className="text-zinc-200" />
                </button>
              </div>
            </div>
          </div>

          @if (productPage().content.length) {
            <div
              class="grid gap-5"
              [ngClass]="viewMode() === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-5' : 'sm:grid-cols-2 xl:grid-cols-4'"
            >
              @for (product of productPage().content; track product.id) {
                <app-product-card
                  [product]="product"
                  [context]="viewMode()"
                  [showSeller]="false"
                />
              }
            </div>

            <div class="flex flex-wrap items-center justify-between gap-4 pt-3">
              <p class="text-sm text-zinc-400">
                Showing
                <span class="text-white">{{ startItem() }}</span>
                to
                <span class="text-white">{{ endItem() }}</span>
                of
                <span class="text-white">{{ productPage().totalElements }}</span>
                products
              </p>

              <div class="flex items-center gap-2">
                <button type="button" class="icon-button" (click)="setPage(page() - 1)" [disabled]="page() === 0">
                  <app-icon name="chevron-left" [size]="18" className="text-zinc-200" />
                </button>

                @for (pageIndex of pages(); track pageIndex) {
                  <button
                    type="button"
                    class="h-11 min-w-11 rounded-2xl border px-4 text-sm font-semibold transition"
                    [ngClass]="
                      pageIndex === page()
                        ? 'border-emerald-400/25 bg-emerald-500/14 text-white'
                        : 'border-white/8 bg-white/[0.02] text-zinc-300 hover:border-white/14 hover:bg-white/[0.04]'
                    "
                    (click)="setPage(pageIndex)"
                  >
                    {{ pageIndex + 1 }}
                  </button>
                }

                <button
                  type="button"
                  class="icon-button"
                  (click)="setPage(page() + 1)"
                  [disabled]="page() + 1 >= productPage().totalPages"
                >
                  <app-icon name="chevron-right" [size]="18" className="text-zinc-200" />
                </button>
              </div>
            </div>
          } @else {
            <app-empty-state
              icon="search"
              title="No products found"
              message="Try a different search term, clear a filter, or browse another category."
            >
              <button type="button" class="button-secondary px-6" (click)="clearFilters()">Reset filters</button>
            </app-empty-state>
          }
        </section>
      </div>
    </section>
  `
})
export class BrowsePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly categoriesService = inject(CategoriesService);

  readonly page = signal(0);
  readonly viewMode = signal<'grid' | 'compact'>('grid');

  readonly filtersForm = this.fb.nonNullable.group({
    search: this.route.snapshot.queryParamMap.get('q') ?? '',
    sortBy: 'newest',
    promo: false,
    categoryId: Number(this.route.snapshot.queryParamMap.get('categoryId') ?? 0),
    minPrice: 0,
    maxPrice: 900
  });

  readonly categories = toSignal(this.categoriesService.getCategories(), {
    initialValue: []
  });

  readonly flatCategories = computed(() => this.categoriesService.flattenCategories(this.categories()));

  readonly productPage = toSignal(
    combineLatest([
      this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue()), debounceTime(140)),
      toObservable(this.page)
    ]).pipe(
      switchMap(([filters, page]) =>
        this.catalog.listProducts({
          search: filters.search,
          categoryId: filters.categoryId || null,
          promo: filters.promo,
          minPrice: filters.minPrice || null,
          maxPrice: filters.maxPrice ? Math.max(filters.maxPrice, 1) : null,
          sortBy: filters.sortBy,
          sortDirection: filters.sortBy === 'price' ? 'asc' : 'desc',
          page,
          size: 10
        })
      )
    ),
    {
      initialValue: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true
      } satisfies PageResponse<Product>
    }
  );

  readonly pages = computed(() =>
    Array.from({ length: this.productPage().totalPages }, (_, index) => index).slice(0, 5)
  );
  readonly startItem = computed(() => this.productPage().number * this.productPage().size + 1);
  readonly endItem = computed(() =>
    Math.min(this.productPage().totalElements, this.startItem() + this.productPage().content.length - 1)
  );

  clearFilters(): void {
    this.filtersForm.setValue({
      search: '',
      sortBy: 'newest',
      promo: false,
      categoryId: 0,
      minPrice: 0,
      maxPrice: 900
    });
    this.page.set(0);
  }

  setPage(page: number): void {
    if (page < 0 || page >= this.productPage().totalPages) {
      return;
    }

    this.page.set(page);
  }
}
