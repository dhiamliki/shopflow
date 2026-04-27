import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Category, PageResponse, Product } from '../models/commerce.models';

export interface MarketplaceMetricsSnapshot {
  totalProducts: number | null;
  totalCategories: number | null;
  promotedProducts: number | null;
  topSellingProducts: number | null;
}

@Injectable({ providedIn: 'root' })
export class MarketplaceMetricsService {
  private readonly http = inject(HttpClient);

  private readonly snapshot$ = forkJoin({
    totalProducts: this.getProductCount(),
    totalCategories: this.getCategoryCount(),
    promotedProducts: this.getProductCount({ promo: true }),
    topSellingProducts: this.getTopSellingCount()
  }).pipe(shareReplay(1));

  getSnapshot(): Observable<MarketplaceMetricsSnapshot> {
    return this.snapshot$;
  }

  private getProductCount(filters: { promo?: boolean } = {}): Observable<number | null> {
    let params = new HttpParams().set('page', '0').set('size', '1');

    if (filters.promo) {
      params = params.set('promo', 'true');
    }

    return this.http
      .get<PageResponse<Product>>(`${API_BASE_URL}/api/products`, { params })
      .pipe(
        map((response) => response.totalElements),
        catchError(() => of(null))
      );
  }

  private getCategoryCount(): Observable<number | null> {
    return this.http
      .get<Category[]>(`${API_BASE_URL}/api/categories`)
      .pipe(
        map((categories) => this.flattenCategories(categories).length),
        catchError(() => of(null))
      );
  }

  private getTopSellingCount(): Observable<number | null> {
    return this.http
      .get<Product[]>(`${API_BASE_URL}/api/products/top-selling`)
      .pipe(
        map((products) => products.length),
        catchError(() => of(null))
      );
  }

  private flattenCategories(categories: Category[]): Category[] {
    return categories.flatMap((category) => [category, ...this.flattenCategories(category.children)]);
  }
}
