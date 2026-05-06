import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CatalogService } from '../../core/services/catalog.service';
import { resolveProductImageUrl } from '../../core/utils/image-url.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

@Component({
  selector: 'app-seller-listings-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, IconComponent, TndCurrencyPipe],
  template: `
    <div class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight text-white">Listings</h1>
          <p class="mt-1 text-sm text-zinc-400">Manage your live product listings.</p>
        </div>
        <a routerLink="/seller/create-listing" class="button-primary min-h-10 px-5 text-sm">
          <app-icon name="plus" [size]="14" className="text-black" />
          Create Listing
        </a>
      </header>

      @if (products().length) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          @for (product of products(); track product.id) {
            <article class="panel-dark flex h-full flex-col overflow-hidden p-3">
              <div class="sf-product-media-well relative aspect-square overflow-hidden rounded-md">
                @if (imageUrl(product.imageUrls[0])) {
                  <img class="sf-product-card-image h-full w-full" [src]="imageUrl(product.imageUrls[0])" [alt]="product.name" />
                } @else {
                  <div class="flex h-full items-center justify-center bg-zinc-900/80">
                    <app-icon name="bag" [size]="24" className="text-zinc-500" />
                  </div>
                }
              </div>

              <div class="mt-4 flex flex-1 flex-col">
                <p class="line-clamp-2 text-base font-semibold text-white">{{ product.name }}</p>
                <p class="mt-1 text-sm text-zinc-400">{{ product.effectivePrice | tndCurrency }}</p>
                <p class="mt-2 text-sm" [ngClass]="product.stock > 0 ? 'text-emerald-300' : 'text-rose-300'">
                  {{ product.stock > 0 ? product.stock + ' in stock' : 'Out of stock' }}
                </p>

                <div class="mt-4 grid gap-2">
                  <a [routerLink]="['/product', product.id]" class="button-secondary min-h-9 justify-center px-3 text-sm">
                    View Product
                  </a>
                  <button
                    type="button"
                    class="button-secondary min-h-9 justify-center px-3 text-sm text-rose-200 hover:text-rose-100"
                    [disabled]="deletingId() === product.id"
                    (click)="deactivate(product.id)"
                  >
                    {{ deletingId() === product.id ? 'Removing...' : 'Deactivate Listing' }}
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <app-empty-state
          icon="package"
          title="No listings yet"
          message="Create your first listing to start selling."
        >
          <a routerLink="/seller/create-listing" class="button-primary px-5">Create Listing</a>
        </app-empty-state>
      }
    </div>
  `
})
export class SellerListingsPageComponent {
  private readonly catalog = inject(CatalogService);

  readonly refreshTick = signal(0);
  readonly deletingId = signal<number | null>(null);

  readonly productsPage = toSignal(
    toObservable(this.refreshTick).pipe(
      switchMap(() => this.catalog.getMyListings(0, 64))
    ),
    {
      initialValue: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 64,
        number: 0,
        first: true,
        last: true
      }
    }
  );

  readonly products = computed(() => this.productsPage().content ?? []);

  imageUrl(raw: string): string {
    return resolveProductImageUrl(raw);
  }

  deactivate(productId: number): void {
    this.deletingId.set(productId);
    this.catalog.deleteProduct(productId).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.refreshTick.update((value) => value + 1);
      },
      error: () => {
        this.deletingId.set(null);
      }
    });
  }
}
