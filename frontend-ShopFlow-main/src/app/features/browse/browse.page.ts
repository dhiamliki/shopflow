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
    <section class="sf-page py-10" [formGroup]="filtersForm">
      <div class="grid gap-5 xl:grid-cols-[248px,1fr] xl:items-end">
        <app-section-heading
          title="Browse Products"
          subtitle="Explore thousands of products from trusted sellers across every category."
        />

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
          <button type="button" class="button-secondary h-11 px-4 xl:hidden" (click)="filterDrawerOpen.set(true)">
            <app-icon name="filters" [size]="16" className="text-zinc-200" />
            Filters
          </button>
          <div class="panel-dark flex h-11 w-full max-w-[500px] items-center gap-3 px-3.5">
            <app-icon name="search" [size]="18" className="text-zinc-500" />
            <input
              formControlName="search"
              type="text"
              placeholder="Search products, brands or categories..."
              class="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            />
          </div>
          <label class="panel-dark flex h-11 min-w-[190px] items-center gap-2 px-3 text-sm text-zinc-300">
            <span>Sort by:</span>
            <select class="select-dark select-compact flex-1 border-0 bg-transparent px-0" formControlName="sortBy">
              <option value="newest">Newest</option>
              <option value="popularity">Most Popular</option>
              <option value="price">Price</option>
            </select>
          </label>
          <div class="panel-dark flex h-11 items-center gap-2 px-1.5">
            <button
              type="button"
              class="icon-button h-9 w-9"
              [ngClass]="viewMode() === 'grid' ? 'border-white/18 bg-white/10' : ''"
              (click)="viewMode.set('grid')"
            >
              <app-icon name="grid" [size]="18" className="text-zinc-200" />
            </button>
            <button
              type="button"
              class="icon-button h-9 w-9"
              [ngClass]="viewMode() === 'compact' ? 'border-white/18 bg-white/10' : ''"
              (click)="viewMode.set('compact')"
            >
              <app-icon name="list" [size]="18" className="text-zinc-200" />
            </button>
          </div>
        </div>
      </div>

      @if (filterDrawerOpen()) {
        <div class="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm xl:hidden" (click)="filterDrawerOpen.set(false)">
          <aside class="ml-auto h-full w-[min(90vw,360px)] overflow-y-auto border-l border-white/10 bg-zinc-950 p-4 shadow-2xl" (click)="$event.stopPropagation()">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-base font-semibold text-white">Filters</h2>
              <button type="button" class="icon-button h-9 w-9" (click)="filterDrawerOpen.set(false)">
                <app-icon name="x" [size]="17" className="text-zinc-200" />
              </button>
            </div>
            <ng-container *ngTemplateOutlet="filtersPanel"></ng-container>
          </aside>
        </div>
      }

      <ng-template #filtersPanel>
        <app-panel-card className="p-0">
          <div class="border-b border-white/8 px-4 py-3">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold text-white">Filters</h2>
                <p class="mt-1 text-xs text-zinc-500">{{ selectedCategoryName() }}</p>
              </div>
              <button type="button" class="text-xs font-medium text-zinc-400 hover:text-white" (click)="clearFilters()">
                Clear
              </button>
            </div>
          </div>

          <div class="space-y-4 px-4 py-4">
            <section class="space-y-2.5">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Categories</h3>
                <app-icon name="chevron-down" [size]="14" className="text-zinc-600" />
              </div>
              <label class="flex min-h-8 items-center gap-2.5 text-sm text-zinc-300">
                <input type="radio" name="browse-category" class="sf-check h-3.5 w-3.5" [checked]="filtersForm.controls.categoryId.value === 0" (change)="filtersForm.patchValue({ categoryId: 0 })" />
                All Categories
              </label>
              @for (category of flatCategories().slice(0, 8); track category.id) {
                <label class="flex min-h-8 items-center gap-2.5 text-sm text-zinc-400 transition hover:text-white">
                  <input
                    type="radio"
                    name="browse-category"
                    class="sf-check h-3.5 w-3.5"
                    [checked]="filtersForm.controls.categoryId.value === category.id"
                    (change)="filtersForm.patchValue({ categoryId: category.id })"
                  />
                  <span class="line-clamp-1">{{ category.name }}</span>
                </label>
              }
            </section>

            <div class="border-t border-white/8"></div>

            <section class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Price</h3>
                <span class="text-xs font-medium text-zinc-300">&#36;{{ filtersForm.controls.maxPrice.value }}</span>
              </div>
              <input type="range" class="w-full accent-white" formControlName="maxPrice" min="1" max="900" />
              <div class="flex justify-between text-xs text-zinc-500">
                <span>$0</span>
                <span>$900+</span>
              </div>
            </section>

            <div class="border-t border-white/8"></div>

            <label class="flex min-h-9 items-center justify-between gap-3 text-sm text-zinc-300">
              <span>Promotions only</span>
              <input type="checkbox" class="sf-check h-4 w-4" formControlName="promo" />
            </label>
          </div>
        </app-panel-card>
      </ng-template>

      <div class="mt-5 grid gap-5 xl:grid-cols-[248px,1fr]">
        <aside class="hidden xl:block">
          <div class="sticky top-24">
            <ng-container *ngTemplateOutlet="filtersPanel"></ng-container>
          </div>
        </aside>

        <section class="space-y-6">
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
                  [showActions]="false"
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
  readonly filterDrawerOpen = signal(false);

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
  readonly selectedCategoryName = computed(() => {
    const categoryId = this.filtersForm.controls.categoryId.value;
    if (!categoryId) {
      return 'All categories';
    }

    return this.flatCategories().find((category) => category.id === categoryId)?.name ?? 'Selected category';
  });

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
