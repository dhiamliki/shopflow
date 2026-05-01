import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoriesService } from '../../core/services/categories.service';
import { CatalogService } from '../../core/services/catalog.service';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';

@Component({
  selector: 'app-create-listing-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, IconComponent, PanelCardComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-2">
          <h1 class="font-display text-5xl font-semibold tracking-tight text-white">Create a New Listing</h1>
          <p class="text-lg text-zinc-400">Fill in the details below to list your product on ShopFlow.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button type="button" class="button-primary px-6" (click)="publish()">Publish Listing</button>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr,320px]">
        <section class="panel-dark space-y-8 p-6 sm:p-8" [formGroup]="listingForm">
          <section class="space-y-5">
            <div>
              <h2 class="text-2xl font-semibold text-white">1. Product Images</h2>
              <p class="mt-2 text-sm text-zinc-400">Add up to 5 images. The first image will be your cover photo.</p>
            </div>

            <input #fileInput type="file" class="hidden" accept="image/*" multiple (change)="onFilesSelected($event)" />

            <div class="grid gap-4 md:grid-cols-[180px,repeat(5,minmax(0,1fr))]">
              <button
                type="button"
                class="flex aspect-square flex-col items-center justify-center rounded-[24px] border border-dashed border-white/14 bg-white/[0.02] text-zinc-300 hover:border-white/20 w-24"
                (click)="fileInput.click()"
              >
                <app-icon name="upload" [size]="22" className="text-zinc-200" />
                <span class="mt-4 text-base font-semibold">Upload Images</span>
                <span class="mt-1 text-sm text-zinc-500">PNG, JPG, WEBP</span>
              </button>

              @for (image of uploadedImages(); track image; let index = $index) {
                <div class="relative overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] w-24">
                  @if (index === 0) {
                    <span class="absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">Cover</span>
                  }
                  <button type="button" class="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50" (click)="removeImage(index)">
                    <app-icon name="x" [size]="16" className="text-white" />
                  </button>
                  <img class="aspect-square w-full object-cover" [src]="image" alt="Listing image" />
                </div>
              }

              @if (uploadedImages().length < 5) {
                <button
                  type="button"
                  class="flex aspect-square items-center justify-center rounded-[24px] border border-dashed border-white/14 bg-white/[0.02] text-zinc-300 w-24"
                  (click)="fileInput.click()"
                >
                  <div class="text-center">
                    <app-icon name="plus" [size]="20" className="mx-auto text-zinc-200" />
                    <p class="mt-3 text-sm">Add more</p>
                  </div>
                </button>
              }
            </div>
          </section>

          <section class="space-y-5 border-t border-white/8 pt-8">
            <div>
              <h2 class="text-2xl font-semibold text-white">2. Product Information</h2>
            </div>

            <div class="space-y-4">
              <input class="input-dark" formControlName="title" placeholder="Product Title" />
              <div class="grid gap-4 md:grid-cols-2">
                <select class="select-dark" formControlName="categoryId">
                  <option value="">Select category</option>
                  @for (option of categoryOptions(); track option.category.id) {
                    <option [value]="option.category.id">{{ categoryOptionLabel(option.depth, option.category.name) }}</option>
                  }
                </select>
              </div>
            </div>
          </section>

          <section class="space-y-5 border-t border-white/8 pt-8">
            <div>
              <h2 class="text-2xl font-semibold text-white">3. Pricing & Inventory</h2>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <input class="input-dark" formControlName="price" type="number" placeholder="Price" />
              <input class="input-dark" formControlName="compareAtPrice" type="number" placeholder="Compare at price" />
              <input class="input-dark" formControlName="quantity" type="number" placeholder="Quantity" />
            </div>
          </section>

          <section class="space-y-5 border-t border-white/8 pt-8">
            <div>
              <h2 class="text-2xl font-semibold text-white">4. Product Details</h2>
            </div>
            <div class="rounded-[24px] border border-white/8 bg-white/[0.03]">
              <textarea class="textarea-dark border-0 bg-transparent" formControlName="description" placeholder="Write a detailed description about your product..."></textarea>
            </div>
          </section>

          @if (message()) {
            <p class="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
              {{ message() }}
            </p>
          }
        </section>

        <aside class="space-y-5">
          <app-panel-card title="Listing Preview" subtitle="This is how your listing will appear to buyers." className="sticky top-28">
            <div class="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03]">
              @if (previewImage()) {
                <img class="aspect-square w-full object-cover" [src]="previewImage()" [alt]="listingForm.controls.title.value || 'Listing preview'" />
              } @else {
                <div class="flex aspect-square w-full items-center justify-center text-zinc-500">
                  <app-icon name="image" [size]="28" className="text-zinc-500" />
                </div>
              }
            </div>
            <h3 class="mt-5 text-2xl font-semibold text-white">{{ listingForm.controls.title.value || 'Your listing title' }}</h3>
            <div class="mt-3 flex items-center gap-3">
              <p class="text-4xl font-semibold tracking-tight text-white">
                {{ previewPrice() | currency: 'USD' : 'symbol' : '1.2-2' }}
              </p>
              @if (compareAtPrice() > previewPrice()) {
                <p class="text-lg text-zinc-500 line-through">
                  {{ compareAtPrice() | currency: 'USD' : 'symbol' : '1.2-2' }}
                </p>
              }
            </div>
            <p class="mt-2 text-sm text-emerald-300">In stock</p>
          </app-panel-card>

          <app-panel-card title="Tips for a great listing">
            <div class="space-y-4">
              @for (tip of tips; track tip.title) {
                <div class="flex items-start gap-4">
                  <app-icon name="circle-check" [size]="18" className="mt-1 text-emerald-300" />
                  <div>
                    <p class="text-lg font-semibold text-white">{{ tip.title }}</p>
                    <p class="mt-1 text-sm leading-6 text-zinc-400">{{ tip.body }}</p>
                  </div>
                </div>
              }
            </div>
          </app-panel-card>
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
  readonly uploadedImages = signal<string[]>([]);

  readonly listingForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    categoryId: ['', Validators.required],
    price: [0, Validators.required],
    compareAtPrice: [0],
    quantity: [1, Validators.required],
    description: ['', Validators.required]
  });

  readonly categories = toSignal(this.categoriesService.getCategories(), { initialValue: [] });
  readonly flatCategories = computed(() => this.categoriesService.flattenCategories(this.categories()));
  readonly categoryOptions = computed(() => this.categoriesService.flattenCategoriesWithDepth(this.categories()));
  readonly previewImage = computed(() => this.uploadedImages()[0] ?? '');
  readonly previewPrice = computed(() => Number(this.listingForm.controls.price.value) || 0);
  readonly compareAtPrice = computed(() => Number(this.listingForm.controls.compareAtPrice.value) || 0);

  readonly tips = [
    {
      title: 'Use high-quality photos',
      body: 'Clear images help buyers trust your listing faster.'
    },
    {
      title: 'Write a detailed description',
      body: 'Include key features, materials, and condition notes.'
    },
    {
      title: 'Set a competitive price',
      body: 'Check comparable listings and stay realistic.'
    },
    {
      title: 'Choose the right category',
      body: 'Help buyers find your item more easily.'
    }
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
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).slice(0, 5 - this.uploadedImages().length);

    for (const file of files) {
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
    this.uploadedImages.update((images) => images.filter((_, currentIndex) => currentIndex !== index));
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
          variants: []
        })
      .subscribe({
        next: () => {
          this.message.set('Listing published successfully.');
          void this.router.navigateByUrl('/seller/dashboard');
        },
        error: () => {
          this.message.set('We could not publish this listing yet. Please check the listing details and try again.');
        }
      });
  }

  categoryOptionLabel(depth: number, name: string): string {
    return `${'-- '.repeat(depth)}${name}`;
  }
}
