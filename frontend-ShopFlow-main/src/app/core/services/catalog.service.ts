import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { PageResponse, Product, ProductFilters, ProductPayload, SellerStore } from '../models/commerce.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly productCache = new Map<number, Observable<Product | null>>();

  listProducts(filters: ProductFilters = {}): Observable<PageResponse<Product>> {
    let params = new HttpParams();

    const entries = Object.entries({
      search: filters.search ?? undefined,
      sellerId: filters.sellerId ?? undefined,
      promo: filters.promo ?? undefined,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      sortBy: filters.sortBy ?? 'newest',
      sortDirection: filters.sortDirection ?? 'desc',
      page: filters.page ?? 0,
      size: filters.size ?? 12
    });

    for (const [key, value] of entries) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    const categoryIds = filters.categoryIds?.filter((categoryId) => categoryId > 0) ?? [];
    if (categoryIds.length) {
      for (const categoryId of categoryIds) {
        params = params.append('categoryId', String(categoryId));
      }
    } else if (filters.categoryId) {
      params = params.set('categoryId', String(filters.categoryId));
    }

    return this.http
      .get<PageResponse<Product>>(`${API_BASE_URL}/api/products`, {
        params
      })
      .pipe(catchError(() => of(this.buildEmptyPage(filters))));
  }

  getProduct(productId: number): Observable<Product | null> {
    const cached = this.productCache.get(productId);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<Product>(`${API_BASE_URL}/api/products/${productId}`)
      .pipe(catchError(() => of(null)), shareReplay(1));

    this.productCache.set(productId, request$);
    return request$;
  }

  getProductsByIds(ids: number[]): Observable<Product[]> {
    const uniqueIds = Array.from(new Set(ids));
    if (!uniqueIds.length) {
      return of([]);
    }

    return forkJoin(uniqueIds.map((id) => this.getProduct(id))).pipe(
      map((products) => products.filter((product): product is Product => product !== null))
    );
  }

  getTopSelling(): Observable<Product[]> {
    return this.http
      .get<Product[]>(`${API_BASE_URL}/api/products/top-selling`)
      .pipe(catchError(() => of([])));
  }

  getStore(sellerId: number): Observable<SellerStore | null> {
    return this.http
      .get<SellerStore>(`${API_BASE_URL}/api/stores/${sellerId}`)
      .pipe(catchError(() => of(null)));
  }

  createProduct(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(`${API_BASE_URL}/api/products`, payload);
  }

  searchProducts(query: string): Observable<Product[]> {
    if (!query.trim()) {
      return of([]);
    }

    return this.http
      .get<Product[]>(`${API_BASE_URL}/api/products/search`, {
        params: new HttpParams().set('q', query)
      })
      .pipe(catchError(() => of([])));
  }

  private buildEmptyPage(filters: ProductFilters): PageResponse<Product> {
    const size = filters.size ?? 12;
    const number = filters.page ?? 0;

    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size,
      number,
      first: number === 0,
      last: true
    };
  }
}
