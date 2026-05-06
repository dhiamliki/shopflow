import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Review, ReviewPayload } from '../models/commerce.models';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly http = inject(HttpClient);

  readonly myReviews = signal<Review[]>([]);

  loadMyReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${API_BASE_URL}/api/reviews/my`).pipe(
      tap((reviews) => this.myReviews.set(reviews)),
      catchError(() => {
        this.myReviews.set([]);
        return of([]);
      })
    );
  }

  createReview(payload: ReviewPayload): Observable<Review> {
    return this.http.post<Review>(`${API_BASE_URL}/api/reviews`, payload).pipe(
      tap((review) => this.myReviews.set([review, ...this.myReviews()]))
    );
  }

  getProductReviews(productId: number): Observable<Review[]> {
    return this.http
      .get<Review[]>(`${API_BASE_URL}/api/reviews/product/${productId}`)
      .pipe(catchError(() => of([])));
  }
}
