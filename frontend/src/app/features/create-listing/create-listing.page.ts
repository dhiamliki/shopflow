import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriesService, FlattenedCategory } from '../../core/services/categories.service';
import { CatalogService } from '../../core/services/catalog.service';
import { IconComponent } from '../../shared/components/icon.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-create-listing-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, TndCurrencyPipe],
  styles: [
    `
      .create-listing-grid {
        display: grid;
        gap: 1.5rem;
      }

      @media (min-width: 1200px) {
        .create-listing-grid {
          grid-template-columns: minmax(0, 1fr) 340px;
          align-items: start;
          gap: 2rem;
        }

        .create-listing-aside {
          position: sticky;
          top: 7rem;
        }
      }
    `
  ],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight text-white">Create a New Listing</h1>
          <p class="mt-2 text-sm text-zinc-400">Publish a product to your store with real catalog data.</p>
        </div>
        <button type="button" class="button-primary min-h-10 px-5 text-sm" (click)="publish()">
          <app-icon name="upload" [size]="14" className="text-black" />
          Publish Listing
        </button>
      </header>

      <div class="create-listing-grid">
        <form class="panel-dark space-y-6 p-6" [formGroup]="listingForm" (ngSubmit)="publish()">
          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-white">1. Product Image</h2>
            <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)" />
            <button type="button" class="button-secondary min-h-10 px-4 text-sm" (click)="fileInput.click()">
              <app-icon name="upload" [size]="14" className="text-zinc-100" />
              Upload Image
            </button>
            @if (uploadedImage()) {
              <div class="relative h-40 w-40 overflow-hidden rounded-md border border-white/12">
                <img class="h-full w-full object-cover" [src]="uploadedImage()" alt="Listing image" />
                <button
                  type="button"
                  class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70"
                  (click)="removeImage()"
                >
                  <app-icon name="x" [size]="12" className="text-white" />
                </button>
              </div>
            }
          </section>

          <section class="space-y-4 border-t border-white/8 pt-5">
            <h2 class="text-lg font-semibold text-white">2. Product Information</h2>
            <label class="block space-y-2">
              <span class="text-sm text-zinc-400">Title</span>
              <input class="input-dark" formControlName="title" placeholder="Product title" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm text-zinc-400">Category</span>
              <select class="select-dark" formControlName="categoryId">
                <option value="">Select category</option>
                @for (option of categoryOptions(); track option.category.id) {
                  <option [value]="option.category.id">{{ categoryOptionLabel(option) }}</option>
                }
              </select>
            </label>
          </section>

          <section class="space-y-4 border-t border-white/8 pt-5">
            <h2 class="text-lg font-semibold text-white">3. Pricing & Inventory</h2>
            <div class="grid gap-4 sm:grid-cols-3">
              <label class="space-y-2">
                <span class="text-sm text-zinc-400">Price (TND)</span>
                <input class="input-dark" type="number" min="0" formControlName="price" />
              </label>
              <label class="space-y-2">
                <span class="text-sm text-zinc-400">Compare at price</span>
                <input class="input-dark" type="number" min="0" formControlName="compareAtPrice" />
              </label>
              <label class="space-y-2">
                <span class="text-sm text-zinc-400">Quantity</span>
                <input class="input-dark" type="number" min="1" formControlName="quantity" />
              </label>
            </div>
          </section>

          <section class="space-y-4 border-t border-white/8 pt-5">
            <h2 class="text-lg font-semibold text-white">4. Description</h2>
            <textarea
              class="textarea-dark"
              formControlName="description"
              rows="6"
              placeholder="Describe the product accurately."
            ></textarea>
          </section>

          @if (message()) {
            <p class="text-sm" [ngClass]="publishError() ? 'text-rose-300' : 'text-emerald-300'">{{ message() }}</p>
          }

          <div class="flex justify-end border-t border-white/8 pt-5">
            <button type="submit" class="button-primary min-h-10 px-5 text-sm">
              Publish Listing
            </button>
          </div>
        </form>

        <aside class="create-listing-aside">
          <div class="panel-dark overflow-hidden">
            <div class="border-b border-white/8 px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Live Preview</p>
            </div>
            <div class="sf-product-media-well aspect-square overflow-hidden border-b border-white/8">
              @if (uploadedImage()) {
                <img class="sf-product-detail-image h-full w-full" [src]="uploadedImage()" [alt]="previewTitle()" />
              } @else {
                <div class="flex h-full items-center justify-center bg-zinc-900/75">
                  <app-icon name="image" [size]="28" className="text-zinc-600" />
                </div>
              }
            </div>
            <div class="space-y-2 p-4">
              <p class="line-clamp-2 text-base font-semibold text-white">{{ previewTitle() }}</p>
              <p class="text-2xl font-semibold text-white">{{ previewPrice() | tndCurrency }}</p>
              <p class="text-sm text-zinc-400">{{ previewStockLabel() }}</p>
              <p class="line-clamp-3 text-sm text-zinc-500">{{ previewDescription() }}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `
})
export class CreateListingPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  readonly message = signal('');
  readonly publishError = signal(false);
  readonly uploadedImage = signal<string>('');

  readonly listingForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    categoryId: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    compareAtPrice: [0],
    quantity: [1, [Validators.required, Validators.min(1)]],
    description: ['', Validators.required]
  });

  readonly categories = toSignal(this.categoriesService.getCategories(), { initialValue: [] });
  readonly categoryOptions = computed(() =>
    this.categoriesService.flattenCategoriesWithDepth(this.categories())
  );

  readonly previewTitle = computed(() => this.listingForm.controls.title.value.trim() || 'Listing title');
  readonly previewDescription = computed(
    () => this.listingForm.controls.description.value.trim() || 'Product description will appear here.'
  );
  readonly previewPrice = computed(() => Number(this.listingForm.controls.price.value) || 0);
  readonly previewStockLabel = computed(() => {
    const quantity = Number(this.listingForm.controls.quantity.value) || 0;
    return quantity > 0 ? `${quantity} in stock` : 'Out of stock';
  });

  constructor() {
    effect(() => {
      const firstCategory = this.categoryOptions()[0];
      if (firstCategory && !this.listingForm.controls.categoryId.value) {
        this.listingForm.patchValue({ categoryId: String(firstCategory.category.id) }, { emitEvent: false });
      }
    });
  }

  categoryOptionLabel(option: FlattenedCategory): string {
    return `${'-- '.repeat(option.depth)}${option.category.name}`;
  }

  onFileSelected(event: Event): void {
    this.message.set('');
    this.publishError.set(false);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      this.publishError.set(true);
      this.message.set('Image must be 5 MB or smaller.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.uploadedImage.set(result);
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeImage(): void {
    this.uploadedImage.set('');
  }

  publish(): void {
    this.message.set('');
    this.publishError.set(false);

    if (this.listingForm.invalid) {
      this.listingForm.markAllAsTouched();
      this.publishError.set(true);
      this.message.set('Please complete all required listing fields.');
      return;
    }

    const value = this.listingForm.getRawValue();
    const actualPrice = Number(value.price);
    const compareAtPrice = Number(value.compareAtPrice);
    const regularPrice = compareAtPrice > actualPrice ? compareAtPrice : actualPrice;
    const promoPrice = compareAtPrice > actualPrice ? actualPrice : null;

    this.catalog
      .createProduct({
        name: value.title.trim(),
        description: value.description.trim(),
        price: regularPrice,
        promoPrice,
        stock: Number(value.quantity),
        categoryIds: [Number(value.categoryId)],
        imageUrls: this.uploadedImage() ? [this.uploadedImage()] : [],
        variants: []
      })
      .subscribe({
        next: () => {
          this.message.set('Listing published successfully.');
          void this.router.navigateByUrl('/seller/listings');
        },
        error: (error: unknown) => {
          this.publishError.set(true);
          this.message.set(this.getPublishErrorMessage(error));
        }
      });
  }

  private getPublishErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Backend is unreachable on port 9090. Start backend and try again.';
      }
      const details = Array.isArray(error.error?.details) ? error.error.details : [];
      if (details.length) {
        return details.join(' ');
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'We could not publish this listing yet.';
  }
}
