import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Cart, CartItemPayload } from '../models/commerce.models';
import { SessionService } from './session.service';

const EMPTY_CART: Cart = {
  id: 0,
  items: [],
  appliedCoupon: null,
  subtotal: 0,
  discount: 0,
  shippingFee: 0,
  totalTtc: 0
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  readonly cart = signal<Cart>(EMPTY_CART);
  readonly isLoading = signal(false);
  readonly count = computed(() =>
    this.cart()
      .items.map((item) => item.quantity)
      .reduce((total, quantity) => total + quantity, 0)
  );

  loadCart(): Observable<Cart> {
    if (!this.session.isCustomer()) {
      this.cart.set(EMPTY_CART);
      return of(EMPTY_CART);
    }

    this.isLoading.set(true);
    return this.http.get<Cart>(`${API_BASE_URL}/api/cart`).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError(() => {
        this.cart.set(EMPTY_CART);
        return of(EMPTY_CART);
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  prefetch(): void {
    if (!this.session.isCustomer() || this.cart().id) {
      return;
    }

    this.loadCart().subscribe();
  }

  addItem(payload: CartItemPayload): Observable<Cart> {
    if (!this.session.isCustomer()) {
      return of(this.cart());
    }

    return this.http.post<Cart>(`${API_BASE_URL}/api/cart/items`, payload).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError(() => of(this.cart()))
    );
  }

  updateItem(itemId: number, quantity: number): Observable<Cart> {
    if (!this.session.isCustomer()) {
      return of(this.cart());
    }

    return this.http
      .put<Cart>(`${API_BASE_URL}/api/cart/items/${itemId}`, {
        quantity
      })
      .pipe(
        tap((cart) => this.cart.set(cart)),
        catchError(() => of(this.cart()))
      );
  }

  removeItem(itemId: number): Observable<Cart> {
    if (!this.session.isCustomer()) {
      return of(this.cart());
    }

    return this.http.delete<Cart>(`${API_BASE_URL}/api/cart/items/${itemId}`).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError(() => of(this.cart()))
    );
  }

  applyCoupon(code: string): Observable<Cart> {
    return this.http.post<Cart>(`${API_BASE_URL}/api/cart/coupon`, { code }).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError(() => of(this.cart()))
    );
  }

  removeCoupon(): Observable<Cart> {
    return this.http.delete<Cart>(`${API_BASE_URL}/api/cart/coupon`).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError(() => of(this.cart()))
    );
  }
}
