import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, debounceTime, startWith, switchMap } from 'rxjs';
import { PageResponse, Product } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { CategoriesService } from '../../core/services/categories.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-browse-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmptyStateComponent,
    IconComponent,
    ProductCardComponent,
  ],
  template: `
    <section class="sf-page py-10" [formGroup]="filtersForm">
      <div class="browse-layout">
        <aside class="browse-sidebar hidden lg:block" aria-label="Product filters">
          <div class="panel-dark browse-sidebar__panel flex flex-col overflow-hidden p-0">
            <div class="border-b border-white/8 px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Refine results
                  </p>
                  <h2 class="text-base font-semibold text-white">Filters</h2>
                  <p class="mt-1 line-clamp-1 text-xs text-zinc-500">
                    {{ selectedCategorySummary() }}
                  </p>
                </div>
                <button
                  type="button"
                  class="shrink-0 text-xs font-medium text-zinc-400 hover:text-white"
                  (click)="clearFilters()"
                >
                  Clear
                </button>
              </div>
            </div>

            <div
              class="browse-sidebar__body min-h-0 flex-1 space-y-4 overflow-y-auto px-3.5 py-3.5"
            >
              <section class="space-y-2.5">
                <div class="flex items-center justify-between px-1">
                  <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Categories
                  </h3>
                  @if (selectedCategoryIds().length) {
                    <span class="text-xs font-semibold text-zinc-300">{{
                      selectedCategoryIds().length
                    }}</span>
                  }
                </div>

                <label
                  class="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md border px-2.5 text-sm transition"
                  [ngClass]="
                    allCategoriesSelected()
                      ? 'border-emerald-400/25 bg-emerald-500/12 text-white'
                      : 'border-white/8 bg-white/[0.02] text-zinc-400 hover:border-white/14 hover:text-white'
                  "
                >
                  <input
                    type="checkbox"
                    class="sf-check h-3.5 w-3.5"
                    [checked]="allCategoriesSelected()"
                    (change)="selectAllCategories()"
                  />
                  <span class="line-clamp-1 font-medium">All Categories</span>
                </label>

                @for (option of filterCategoryOptions(); track option.category.id) {
                  <label
                    class="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md border px-2.5 text-sm transition"
                    [style.margin-left.px]="option.depth * 10"
                    [ngClass]="
                      categorySelected(option.category.id)
                        ? 'border-white/20 bg-white/10 text-white'
                        : 'border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-white'
                    "
                  >
                    <input
                      type="checkbox"
                      class="sf-check h-3.5 w-3.5"
                      [checked]="categorySelected(option.category.id)"
                      (change)="toggleCategory(option.category.id)"
                    />
                    <span
                      class="line-clamp-1"
                      [ngClass]="option.depth === 0 ? 'font-medium' : 'text-zinc-400'"
                    >
                      {{ option.category.name }}
                    </span>
                  </label>
                }
              </section>

              <div class="border-t border-white/8"></div>

              <section class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Price
                  </h3>
                  <span class="text-xs font-medium text-zinc-300"
                    >&#36;{{ filtersForm.controls.maxPrice.value }}</span
                  >
                </div>
                <input
                  type="range"
                  class="w-full accent-white"
                  formControlName="maxPrice"
                  min="1"
                  max="900"
                />
                <div class="flex justify-between text-xs text-zinc-500">
                  <span>$0</span>
                  <span>$900+</span>
                </div>
              </section>

              <div class="border-t border-white/8"></div>

              <label
                class="flex min-h-9 items-center justify-between gap-3 rounded-md border border-white/8 bg-white/[0.02] px-3 text-sm text-zinc-300"
              >
                <span>Promotions only</span>
                <input type="checkbox" class="sf-check h-4 w-4" formControlName="promo" />
              </label>
            </div>
          </div>
        </aside>

        <section class="min-w-0 space-y-5">
          <div
            class="panel-dark flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between"
          >
            <div
              class="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md border border-white/8 bg-black/20 px-3.5"
            >
              <app-icon name="search" [size]="18" className="text-zinc-500" />
              <input
                formControlName="search"
                type="text"
                placeholder="Search products, brands or categories..."
                class="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>

            <div class="flex flex-col gap-3 xl:ml-4 xl:min-w-fit">
              <div class="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span
                  class="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300"
                >
                  {{ productPage().totalElements }} items
                </span>
                @if (selectedCategoryIds().length) {
                  <span
                    class="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300"
                  >
                    {{ selectedCategorySummary() }}
                  </span>
                }
              </div>

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  class="flex min-h-11 min-w-[190px] items-center gap-2 rounded-md border border-white/8 bg-black/20 px-3 text-sm text-zinc-300"
                >
                  <span>Sort by:</span>
                  <select
                    class="select-dark select-compact flex-1 border-0 bg-transparent px-0"
                    formControlName="sortBy"
                  >
                    <option value="newest">Newest</option>
                    <option value="popularity">Most Popular</option>
                    <option value="price">Price</option>
                  </select>
                </label>

                <div
                  class="flex min-h-11 items-center gap-2 rounded-md border border-white/8 bg-black/20 px-1.5"
                >
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
          </div>

          @if (productPage().content.length) {
            <div
              class="grid gap-5"
              [ngClass]="
                viewMode() === 'grid'
                  ? 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                  : 'sm:grid-cols-2 2xl:grid-cols-3'
              "
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
                <button
                  type="button"
                  class="icon-button"
                  (click)="setPage(page() - 1)"
                  [disabled]="page() === 0"
                >
                  <app-icon name="chevron-left" [size]="18" className="text-zinc-200" />
                </button>

                @for (pageIndex of pages(); track pageIndex) {
                  <button
                    type="button"
                    class="h-11 min-w-11 rounded-md border px-4 text-sm font-semibold transition"
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
              <button type="button" class="button-secondary px-6" (click)="clearFilters()">
                Reset filters
              </button>
            </app-empty-state>
          }
        </section>
      </div>
    </section>
  `,
  styles: [
    `
      .browse-layout {
        display: grid;
        gap: 1.5rem;
      }

      .browse-sidebar__body {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
      }

      .browse-sidebar__body::-webkit-scrollbar {
        width: 8px;
      }

      .browse-sidebar__body::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 999px;
      }

      .browse-sidebar__body::-webkit-scrollbar-track {
        background: transparent;
      }

      @media (min-width: 1024px) {
        .browse-layout {
          grid-template-columns: 17.25rem minmax(0, 1fr);
          align-items: start;
        }

        .browse-sidebar {
          position: sticky;
          top: 6rem;
          align-self: start;
        }

        .browse-sidebar__panel {
          max-height: calc(100vh - 7.5rem);
        }
      }
    `,
  ],
})
export class BrowsePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly page = signal(0);
  readonly viewMode = signal<'grid' | 'compact'>('grid');

  readonly filtersForm = this.fb.nonNullable.group({
    search: this.route.snapshot.queryParamMap.get('q') ?? '',
    sortBy: 'newest',
    promo: false,
    categoryIds: [this.initialCategoryIds()],
    minPrice: 0,
    maxPrice: 900,
  });

  readonly categories = toSignal(this.categoriesService.getCategories(), {
    initialValue: [],
  });

  readonly filterValues = toSignal(
    this.filtersForm.valueChanges.pipe(startWith(this.filtersForm.getRawValue())),
    { initialValue: this.filtersForm.getRawValue() },
  );

  readonly flatCategories = computed(() =>
    this.categoriesService.flattenCategories(this.categories()),
  );
  readonly filterCategoryOptions = computed(() =>
    this.categoriesService.flattenCategoriesWithDepth(this.categories()),
  );
  readonly selectedCategoryIds = computed(() => this.filterValues().categoryIds ?? []);
  readonly allCategoriesSelected = computed(() => this.selectedCategoryIds().length === 0);
  readonly selectedCategorySummary = computed(() => {
    const categoryIds = this.selectedCategoryIds();
    if (!categoryIds.length) {
      return 'All categories';
    }

    const names = categoryIds
      .map(
        (categoryId) => this.flatCategories().find((category) => category.id === categoryId)?.name,
      )
      .filter((name): name is string => Boolean(name));

    if (!names.length) {
      return `${categoryIds.length} selected`;
    }

    return names.length <= 2
      ? names.join(', ')
      : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  });

  readonly productPage = toSignal(
    combineLatest([
      this.filtersForm.valueChanges.pipe(
        startWith(this.filtersForm.getRawValue()),
        debounceTime(140),
      ),
      toObservable(this.page),
    ]).pipe(
      switchMap(([filters, page]) =>
        this.catalog.listProducts({
          search: filters.search,
          categoryIds: filters.categoryIds?.length ? filters.categoryIds : null,
          promo: filters.promo,
          minPrice: filters.minPrice || null,
          maxPrice: filters.maxPrice ? Math.max(filters.maxPrice, 1) : null,
          sortBy: filters.sortBy,
          sortDirection: filters.sortBy === 'price' ? 'asc' : 'desc',
          page,
          size: 12,
        }),
      ),
    ),
    {
      initialValue: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 12,
        number: 0,
        first: true,
        last: true,
      } satisfies PageResponse<Product>,
    },
  );

  readonly pages = computed(() =>
    Array.from({ length: this.productPage().totalPages }, (_, index) => index).slice(0, 5),
  );
  readonly startItem = computed(() => this.productPage().number * this.productPage().size + 1);
  readonly endItem = computed(() =>
    Math.min(
      this.productPage().totalElements,
      this.startItem() + this.productPage().content.length - 1,
    ),
  );

  constructor() {
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.page.set(0));
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      search: '',
      sortBy: 'newest',
      promo: false,
      categoryIds: [],
      minPrice: 0,
      maxPrice: 900,
    });
    this.page.set(0);
  }

  selectAllCategories(): void {
    this.filtersForm.patchValue({ categoryIds: [] });
    this.page.set(0);
  }

  toggleCategory(categoryId: number): void {
    const selected = this.filtersForm.controls.categoryIds.value;
    const next = selected.includes(categoryId)
      ? selected.filter((id) => id !== categoryId)
      : [...selected, categoryId];

    this.filtersForm.patchValue({ categoryIds: next });
    this.page.set(0);
  }

  categorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds().includes(categoryId);
  }

  setPage(page: number): void {
    if (page < 0 || page >= this.productPage().totalPages) {
      return;
    }

    this.page.set(page);
  }

  private initialCategoryIds(): number[] {
    const categoryIdParams = this.route.snapshot.queryParamMap.getAll('categoryId');
    const categoryIdsParams = this.route.snapshot.queryParamMap
      .getAll('categoryIds')
      .flatMap((value) => value.split(','));

    return Array.from(
      new Set(
        [...categoryIdParams, ...categoryIdsParams]
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    );
  }
}
