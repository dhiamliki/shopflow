import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoriesService } from '../../core/services/categories.service';
import { CatalogService } from '../../core/services/catalog.service';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-create-listing-page',
  standalone: true,
  imports: [CommonModule, TndCurrencyPipe, ReactiveFormsModule, IconComponent, PanelCardComponent],
  styles: [
    `
      .create-listing-grid {
        display: grid;
        gap: 1.5rem;
      }

      @media (min-width: 1024px) {
        .create-listing-grid {
          grid-template-columns: minmax(0, 1fr) 340px;
          align-items: start;
          gap: 2rem;
        }

        .create-listing-aside {
          position: sticky;
          top: 7rem;
          max-height: calc(100vh - 8rem);
          overflow-y: auto;
        }
      }

      .listing-thumb-slot {
        width: 88px;
        height: 88px;
        flex-shrink: 0;
      }
    `,
  ],
  template: `
    <div class="space-y-7">
      <!-- Page header -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold tracking-tight text-white lg:text-5xl">
            Create a New Listing
          </h1>
          <p class="mt-2 text-base text-zinc-500">
            Fill in the details below to list your product on ShopFlow.
          </p>
        </div>
        <button type="button" class="button-primary px-7" (click)="publish()">
          <app-icon name="upload" [size]="16" className="text-black" />
          Publish Listing
        </button>
      </div>

      <div class="create-listing-grid">
        <!-- ── Main form ─────────────────────────────── -->
        <div class="panel-dark space-y-0 overflow-hidden" [formGroup]="listingForm">
          <!-- 1. Images -->
          <div class="space-y-5 p-6 sm:p-8">
            <div class="flex items-center gap-3">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white"
                >1</span
              >
              <div>
                <h2 class="text-lg font-semibold text-white">Product Images</h2>
                <p class="text-sm text-zinc-500">First image is the cover. Up to 5 total.</p>
              </div>
            </div>

            <input
              #fileInput
              type="file"
              class="hidden"
              accept="image/*"
              multiple
              (change)="onFilesSelected($event)"
            />

            <div class="flex flex-wrap gap-3">
              <!-- Upload trigger -->
              <button
                type="button"
                class="listing-thumb-slot flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-zinc-400 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
                (click)="fileInput.click()"
              >
                <app-icon name="upload" [size]="20" className="text-zinc-300" />
                <span class="text-xs font-medium leading-tight text-center"
                  >Upload<br />Images</span
                >
              </button>

              <!-- Uploaded images -->
              @for (image of uploadedImages(); track image; let index = $index) {
                <div
                  class="listing-thumb-slot relative overflow-hidden rounded-xl border border-white/10"
                >
                  @if (index === 0) {
                    <span
                      class="absolute left-2 top-2 z-10 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black"
                      >Cover</span
                    >
                  }
                  <button
                    type="button"
                    class="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition hover:bg-black/80"
                    (click)="removeImage(index)"
                  >
                    <app-icon name="x" [size]="12" className="text-white" />
                  </button>
                  <img class="h-full w-full object-cover" [src]="image" alt="Listing image" />
                </div>
              }

              <!-- Add more slot -->
              @if (uploadedImages().length > 0 && uploadedImages().length < 5) {
                <button
                  type="button"
                  class="listing-thumb-slot flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/14 bg-white/[0.02] text-zinc-500 transition hover:border-white/22 hover:text-zinc-300"
                  (click)="fileInput.click()"
                >
                  <app-icon name="plus" [size]="18" className="text-zinc-400" />
                  <span class="text-xs">Add more</span>
                </button>
              }
            </div>
          </div>

          <div class="border-t border-white/8"></div>

          <!-- 2. Product Information -->
          <div class="space-y-4 p-6 sm:p-8">
            <div class="flex items-center gap-3">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white"
                >2</span
              >
              <h2 class="text-lg font-semibold text-white">Product Information</h2>
            </div>
            <input class="input-dark" formControlName="title" placeholder="Product title" />
            <select class="select-dark" formControlName="categoryId">
              <option value="">Select a category</option>
              @for (option of categoryOptions(); track option.category.id) {
                <option [value]="option.category.id">
                  {{ categoryOptionLabel(option.depth, option.category.name) }}
                </option>
              }
            </select>
          </div>

          <div class="border-t border-white/8"></div>

          <!-- 3. Pricing & Inventory -->
          <div class="space-y-4 p-6 sm:p-8">
            <div class="flex items-center gap-3">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white"
                >3</span
              >
              <h2 class="text-lg font-semibold text-white">Pricing & Inventory</h2>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-zinc-500">Price (TND)</label>
                <input
                  class="input-dark"
                  formControlName="price"
                  type="number"
                  placeholder="0.00"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-zinc-500">Compare at price</label>
                <input
                  class="input-dark"
                  formControlName="compareAtPrice"
                  type="number"
                  placeholder="0.00"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-zinc-500">Stock quantity</label>
                <input
                  class="input-dark"
                  formControlName="quantity"
                  type="number"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <div class="border-t border-white/8"></div>

          <!-- 4. Description -->
          <div class="space-y-4 p-6 sm:p-8">
            <div class="flex items-center gap-3">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white"
                >4</span
              >
              <h2 class="text-lg font-semibold text-white">Product Description</h2>
            </div>
            <textarea
              class="textarea-dark"
              formControlName="description"
              placeholder="Write a detailed description — materials, condition, key features..."
            ></textarea>
          </div>

          @if (message()) {
            <div class="border-t border-white/8 px-6 py-4 sm:px-8">
              <p
                class="rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
              >
                {{ message() }}
              </p>
            </div>
          }
        </div>

        <!-- ── Sidebar ─────────────────────────────── -->
        <aside class="create-listing-aside space-y-4">
          <!-- Preview card -->
          <div class="panel-dark overflow-hidden">
            <div class="border-b border-white/8 px-5 py-4">
              <p class="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Live Preview
              </p>
            </div>

            <!-- Image preview -->
            <div
              class="sf-product-media-well relative aspect-[4/3] w-full overflow-hidden border-b border-white/8"
            >
              @if (previewImage()) {
                <img
                  class="sf-product-detail-image"
                  [src]="previewImage()"
                  [alt]="listingForm.controls.title.value || 'Preview'"
                />
              } @else {
                <div class="flex h-full flex-col items-center justify-center gap-2 text-zinc-600">
                  <app-icon name="image" [size]="28" className="text-zinc-600" />
                  <p class="text-xs">No image yet</p>
                </div>
              }
            </div>

            <!-- Preview info -->
            <div class="space-y-2 p-5">
              <p class="text-base font-semibold text-white leading-snug">
                {{ listingForm.controls.title.value || 'Your listing title' }}
              </p>
              @if (previewPrice() > 0) {
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-bold tracking-tight text-white">{{
                    previewPrice() | tndCurrency
                  }}</span>
                  @if (compareAtPrice() > previewPrice()) {
                    <span class="text-sm text-zinc-500 line-through">{{
                      compareAtPrice() | tndCurrency
                    }}</span>
                  }
                </div>
              } @else {
                <p class="text-sm text-zinc-600">Price will appear here</p>
              }
              <p class="flex items-center gap-1.5 text-xs text-emerald-400">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                In stock
              </p>
            </div>
          </div>

          <!-- Tips card -->
          <div class="panel-dark p-5 space-y-4">
            <p class="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Tips for a great listing
            </p>
            @for (tip of tips; track tip.title) {
              <div class="flex items-start gap-3">
                <app-icon
                  name="circle-check"
                  [size]="16"
                  className="mt-0.5 shrink-0 text-emerald-400"
                />
                <div>
                  <p class="text-sm font-semibold text-white">{{ tip.title }}</p>
                  <p class="mt-0.5 text-xs leading-5 text-zinc-500">{{ tip.body }}</p>
                </div>
              </div>
            }
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class CreateListingPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  readonly message = signal('');
  readonly uploadedImages = signal<string[]>([]);

  readonly listingForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    categoryId: ['', Validators.required],
    price: [0, Validators.required],
    compareAtPrice: [0],
    quantity: [1, Validators.required],
    description: ['', Validators.required],
  });

  readonly categories = toSignal(this.categoriesService.getCategories(), { initialValue: [] });
  readonly flatCategories = computed(() =>
    this.categoriesService.flattenCategories(this.categories()),
  );
  readonly categoryOptions = computed(() =>
    this.categoriesService.flattenCategoriesWithDepth(this.categories()),
  );
  readonly previewImage = computed(() => this.uploadedImages()[0] ?? '');
  readonly previewPrice = computed(() => Number(this.listingForm.controls.price.value) || 0);
  readonly compareAtPrice = computed(
    () => Number(this.listingForm.controls.compareAtPrice.value) || 0,
  );

  readonly tips = [
    {
      title: 'Use high-quality photos',
      body: 'Clear images help buyers trust your listing faster.',
    },
    {
      title: 'Write a detailed description',
      body: 'Include key features, materials, and condition notes.',
    },
    {
      title: 'Set a competitive price',
      body: 'Check comparable listings and stay realistic.',
    },
    {
      title: 'Choose the right category',
      body: 'Help buyers find your item more easily.',
    },
  ];

  constructor() {
    effect(() => {
      const firstCategory = this.flatCategories()[0];
      if (!this.listingForm.controls.categoryId.value && firstCategory) {
        this.listingForm.patchValue({ categoryId: String(firstCategory.id) }, { emitEvent: false });
      }
    });
  }

  onFilesSelected(event: Event): void {
    this.message.set('');
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).slice(0, 5 - this.uploadedImages().length);

    for (const file of files) {
      if (file.size > MAX_IMAGE_FILE_BYTES) {
        this.message.set('Each image must be 5 MB or smaller.');
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          return;
        }

        this.uploadedImages.update((images) => [...images, result].slice(0, 5));
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removeImage(index: number): void {
    this.uploadedImages.update((images) =>
      images.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  publish(): void {
    this.message.set('');

    if (this.listingForm.invalid) {
      this.listingForm.markAllAsTouched();
      this.message.set('Please complete the required listing fields.');
      return;
    }

    const value = this.listingForm.getRawValue();
    const actualPrice = Number(value.price);
    const compareAtPrice = Number(value.compareAtPrice);
    const regularPrice = compareAtPrice > actualPrice ? compareAtPrice : actualPrice;
    const promoPrice = compareAtPrice > actualPrice ? actualPrice : null;

    this.catalog
      .createProduct({
        name: value.title,
        description: value.description,
        price: regularPrice,
        promoPrice,
        stock: Number(value.quantity),
        categoryIds: [Number(value.categoryId)],
        imageUrls: this.uploadedImages(),
        variants: [],
      })
      .subscribe({
        next: () => {
          this.message.set('Listing published successfully.');
          void this.router.navigateByUrl('/seller/dashboard');
        },
        error: (error: unknown) => {
          this.message.set(this.getPublishErrorMessage(error));
        },
      });
  }

  categoryOptionLabel(depth: number, name: string): string {
    return `${'-- '.repeat(depth)}${name}`;
  }

  private getPublishErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Backend is unreachable on port 9090. Start backend and try again.';
      }

      const message = typeof error.error?.message === 'string' ? error.error.message : null;
      const details = Array.isArray(error.error?.details) ? error.error.details : [];
      if (details.length > 0) {
        return details.join(' ');
      }
      if (message) {
        return message;
      }
    }
    return 'We could not publish this listing yet. Please check the listing details and try again.';
  }
}
