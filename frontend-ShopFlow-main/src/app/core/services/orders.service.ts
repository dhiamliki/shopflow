import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Order } from '../models/commerce.models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  readonly orders = signal<Order[]>([]);

  loadMyOrders(): Observable<Order[]> {
    if (!this.session.isCustomer()) {
      this.orders.set([]);
      return of([]);
    }

    return this.http.get<Order[]>(`${API_BASE_URL}/api/orders/my`).pipe(
      tap((orders) => this.orders.set(orders)),
      catchError(() => {
        this.orders.set([]);
        return of([]);
      })
    );
  }

  getOrder(orderId: number): Observable<Order | null> {
    return this.http
      .get<Order>(`${API_BASE_URL}/api/orders/${orderId}`)
      .pipe(catchError(() => of(null)));
  }

  placeOrder(addressId: number): Observable<Order> {
    if (!this.session.isCustomer()) {
      return throwError(() => new Error('Only buyer accounts can place orders.'));
    }

    return this.http.post<Order>(`${API_BASE_URL}/api/orders`, {
      addressId
    });
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.http.put<Order>(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {}).pipe(
      tap((order) => {
        const nextOrders = this.orders().map((entry) => (entry.id === order.id ? order : entry));
        this.orders.set(nextOrders);
      })
    );
  }
}
