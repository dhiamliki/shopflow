import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartService } from '../../core/services/cart.service';
import { SessionService } from '../../core/services/session.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    PanelCardComponent,
    ProductCardComponent,
    SectionHeadingComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <app-section-heading
          title="My Wishlist"
          [subtitle]="wishlistItems().length + ' items saved for later'"
        />

        <div class="flex flex-wrap gap-3">
          <button type="button" class="button-secondary px-6" (click)="shareWishlist()">
            <app-icon name="share" [size]="16" className="text-zinc-200" />
            Share Wishlist
          </button>
          <button type="button" class="button-primary px-6" (click)="moveAllToCart()">Move All to Cart</button>
        </div>
      </div>

      @if (!wishlistItems().length) {
        <app-empty-state
          icon="heart"
          title="Your wishlist is empty"
          message="Save products you love and they will show up here for later."
        >
          <a routerLink="/browse" class="button-primary px-8">Browse products</a>
        </app-empty-state>
      } @else {
        <div class="grid gap-6 xl:grid-cols-[1fr,260px]">
          <section class="space-y-5">
            <div class="panel-dark flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <label class="inline-flex items-center gap-3 text-zinc-300">
                <input type="checkbox" class="accent-emerald-400" checked />
                Select All
              </label>

              <div class="flex flex-wrap gap-3">
                <select class="select-dark" [formControl]="categoryFilter">
                  <option value="">All Categories</option>
                  @for (category of categoryOptions(); track category) {
                    <option [value]="category">{{ category }}</option>
                  }
                </select>
                <select class="select-dark" [formControl]="sortControl">
                  <option value="recent">Recently Added</option>
                  <option value="price-high">Highest Price</option>
                  <option value="price-low">Lowest Price</option>
                </select>
                <button type="button" class="icon-button">
                  <app-icon name="grid" [size]="18" className="text-zinc-200" />
                </button>
              </div>
            </div>

            <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              @for (item of filteredItems(); track item.id) {
                <app-product-card [product]="item" context="wishlist" />
              }
            </div>
          </section>

          <aside class="space-y-5">
            <app-panel-card title="Wishlist Summary">
              <div class="space-y-5 text-base">
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Items</span>
                  <span class="text-white">{{ wishlistItems().length }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-zinc-400">Estimated Total</span>
                  <span class="text-white">{{ estimatedTotal() | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
                </div>
              </div>
              <button type="button" class="button-primary mt-6 w-full justify-center" (click)="moveAllToCart()">
                Move All to Cart
              </button>
              <div class="mt-6 border-t border-white/8 pt-5">
                <p class="text-lg font-semibold text-white">Tip</p>
                <p class="mt-2 text-sm leading-7 text-zinc-400">Prices and availability can change, so it pays to check out when you are ready.</p>
              </div>
            </app-panel-card>
          </aside>
        </div>
      }
    </div>
  `
})
export class WishlistPageComponent {
  private readonly workspace = inject(WorkspaceService);
  private readonly cartService = inject(CartService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly categoryFilter = new FormControl('', { nonNullable: true });
  readonly sortControl = new FormControl('recent', { nonNullable: true });

  readonly wishlistItems = computed(() => this.workspace.wishlist());
  readonly categoryOptions = computed(() =>
    Array.from(new Set(this.workspace.wishlist().flatMap((item) => item.categories))).sort()
  );
  readonly estimatedTotal = computed(() =>
    this.workspace.wishlist().reduce((total, item) => total + item.effectivePrice, 0)
  );

  readonly filteredItems = toSignal(
    combineLatest([
      this.categoryFilter.valueChanges.pipe(startWith(this.categoryFilter.getRawValue())),
      this.sortControl.valueChanges.pipe(startWith(this.sortControl.getRawValue()))
    ]).pipe(
      map(([category, sort]) => {
        let items = this.workspace
          .wishlist()
          .filter((item) => !category || item.categories.includes(category));

        switch (sort) {
          case 'price-high':
            items = [...items].sort((a, b) => b.effectivePrice - a.effectivePrice);
            break;
          case 'price-low':
            items = [...items].sort((a, b) => a.effectivePrice - b.effectivePrice);
            break;
          default:
            items = [...items].reverse();
            break;
        }

        return items;
      })
    ),
    { initialValue: this.workspace.wishlist() }
  );

  moveAllToCart(): void {
    if (!this.session.isCustomer()) {
      void this.router.navigate(['/auth'], {
        queryParams: {
          mode: 'login',
          redirect: '/account/wishlist'
        }
      });
      return;
    }

    for (const item of this.workspace.wishlist()) {
      this.cartService
        .addItem({
          productId: item.id,
          variantId: item.variants[0]?.id ?? null,
          quantity: 1
        })
        .subscribe();
    }
  }

  shareWishlist(): void {
    const url = `${location.origin}/account/wishlist`;
    if (navigator.share) {
      void navigator.share({ title: 'Shopflow Wishlist', url });
      return;
    }

    void navigator.clipboard?.writeText(url);
  }
}
