import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { Product } from '../../core/models/commerce.models';
import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { resolveProductImageUrl } from '../../core/utils/image-url.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

type ReviewDraft = {
  rating: number;
  comment: string;
  submitting: boolean;
  error: string;
};

@Component({
  selector: 'app-my-reviews-page',
  standalone: true,
  imports: [CommonModule, SectionHeadingComponent, EmptyStateComponent, IconComponent, TndCurrencyPipe],
  template: `
    <div class="space-y-8">
      <app-section-heading
        title="My Reviews"
        subtitle="Review products from delivered orders and track your submitted feedback."
      />

      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-white">Write a Review</h2>
        @if (reviewableProducts().length) {
          <div class="space-y-4">
            @for (product of reviewableProducts(); track product.id) {
              <article class="panel-dark grid gap-4 p-5 md:grid-cols-[96px,1fr]">
                <img
                  class="h-20 w-20 rounded-md object-cover md:h-24 md:w-24"
                  [src]="imageUrl(product.imageUrls[0])"
                  [alt]="product.name"
                />
                <div class="space-y-4">
                  <div>
                    <p class="text-lg font-semibold text-white">{{ product.name }}</p>
                    <p class="text-sm text-zinc-400">{{ product.effectivePrice | tndCurrency }}</p>
                  </div>

                  <div class="space-y-3">
                    <label class="block text-sm text-zinc-300">Rating</label>
                    <div class="flex gap-2">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <button
                          type="button"
                          class="icon-button h-9 w-9"
                          [ngClass]="draftFor(product.id).rating >= star ? 'border-amber-300/60 bg-amber-400/15' : ''"
                          (click)="setRating(product.id, star)"
                        >
                          <app-icon name="star" [size]="16" [className]="draftFor(product.id).rating >= star ? 'text-amber-300' : 'text-zinc-500'" />
                        </button>
                      }
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label class="block text-sm text-zinc-300">Comment</label>
                    <textarea
                      class="textarea-dark"
                      rows="4"
                      [value]="draftFor(product.id).comment"
                      (input)="setComment(product.id, $any($event.target).value)"
                      placeholder="Share your experience with this product."
                    ></textarea>
                  </div>

                  @if (draftFor(product.id).error) {
                    <p class="text-sm text-rose-300">{{ draftFor(product.id).error }}</p>
                  }

                  <button
                    type="button"
                    class="button-primary min-h-10 px-4 text-sm"
                    [disabled]="draftFor(product.id).submitting"
                    (click)="submit(product)"
                  >
                    Submit Review
                  </button>
                </div>
              </article>
            }
          </div>
        } @else {
          <app-empty-state
            icon="star"
            title="No pending reviews"
            message="You can review products after their orders are delivered."
          />
        }
      </section>

      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-white">Submitted Reviews</h2>
        @if (reviews().length) {
          <div class="space-y-3">
            @for (review of reviews(); track review.id) {
              <article class="panel-dark space-y-2 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <p class="font-semibold text-white">Product #{{ review.productId }}</p>
                  <p class="text-sm text-zinc-400">{{ review.createdAt | date: 'mediumDate' }}</p>
                </div>
                <div class="flex items-center gap-1">
                  @for (star of [1, 2, 3, 4, 5]; track star) {
                    <app-icon
                      name="star"
                      [size]="14"
                      [className]="star <= review.rating ? 'text-amber-300' : 'text-zinc-600'"
                    />
                  }
                </div>
                <p class="text-sm text-zinc-300">{{ review.comment }}</p>
                <p class="text-xs text-zinc-500">{{ review.approved ? 'Approved' : 'Pending moderation' }}</p>
              </article>
            }
          </div>
        } @else {
          <app-empty-state icon="message" title="No reviews yet" message="Your submitted reviews will appear here." />
        }
      </section>
    </div>
  `
})
export class MyReviewsPageComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly catalogService = inject(CatalogService);

  readonly drafts = signal<Record<number, ReviewDraft>>({});
  readonly orders = this.ordersService.orders;
  readonly reviews = this.reviewsService.myReviews;

  readonly reviewableProductIds = computed(() => {
    const reviewedProductIds = new Set(this.reviews().map((review) => review.productId));
    const deliveredProducts = this.orders()
      .filter((order) => order.status === 'DELIVERED')
      .flatMap((order) => order.items.map((item) => item.productId));

    return Array.from(new Set(deliveredProducts)).filter((productId) => !reviewedProductIds.has(productId));
  });

  readonly reviewableProducts = toSignal(
    toObservable(this.reviewableProductIds).pipe(
      switchMap((productIds) => this.catalogService.getProductsByIds(productIds))
    ),
    { initialValue: [] }
  );

  constructor() {
    this.ordersService.loadMyOrders().subscribe();
    this.reviewsService.loadMyReviews().subscribe();
  }

  draftFor(productId: number): ReviewDraft {
    return (
      this.drafts()[productId] ?? {
        rating: 5,
        comment: '',
        submitting: false,
        error: ''
      }
    );
  }

  setRating(productId: number, rating: number): void {
    this.patchDraft(productId, { rating, error: '' });
  }

  setComment(productId: number, comment: string): void {
    this.patchDraft(productId, { comment, error: '' });
  }

  submit(product: Product): void {
    const draft = this.draftFor(product.id);
    if (!draft.comment.trim()) {
      this.patchDraft(product.id, { error: 'Please enter a review comment.' });
      return;
    }

    this.patchDraft(product.id, { submitting: true, error: '' });
    this.reviewsService
      .createReview({
        productId: product.id,
        rating: draft.rating,
        comment: draft.comment.trim()
      })
      .subscribe({
        next: () => {
          this.patchDraft(product.id, { rating: 5, comment: '', submitting: false, error: '' });
          this.reviewsService.loadMyReviews().subscribe();
        },
        error: () => {
          this.patchDraft(product.id, {
            submitting: false,
            error: 'Unable to submit this review right now.'
          });
        }
      });
  }

  private patchDraft(productId: number, patch: Partial<ReviewDraft>): void {
    const current = this.draftFor(productId);
    this.drafts.set({
      ...this.drafts(),
      [productId]: {
        ...current,
        ...patch
      }
    });
  }

  imageUrl(raw: string): string {
    return resolveProductImageUrl(raw);
  }
}
