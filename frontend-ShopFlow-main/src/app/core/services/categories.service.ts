import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Category } from '../models/commerce.models';

export interface FlattenedCategory {
  category: Category;
  depth: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  private readonly categories$ = this.http.get<Category[]>(`${API_BASE_URL}/api/categories`).pipe(
    catchError(() => of([])),
    shareReplay(1)
  );

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  flattenCategories(categories: Category[]): Category[] {
    return categories.flatMap((category) => [category, ...this.flattenCategories(category.children)]);
  }

  flattenCategoriesWithDepth(categories: Category[], depth = 0): FlattenedCategory[] {
    return categories.flatMap((category) => [
      { category, depth },
      ...this.flattenCategoriesWithDepth(category.children, depth + 1)
    ]);
  }
}
