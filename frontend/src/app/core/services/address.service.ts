import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Address, AddressPayload } from '../models/commerce.models';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly http = inject(HttpClient);

  readonly addresses = signal<Address[]>([]);

  loadAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${API_BASE_URL}/api/addresses`).pipe(
      tap((addresses) => this.addresses.set(addresses)),
      catchError(() => {
        this.addresses.set([]);
        return of([]);
      })
    );
  }

  createAddress(payload: AddressPayload): Observable<Address> {
    return this.http.post<Address>(`${API_BASE_URL}/api/addresses`, payload).pipe(
      tap((address) => this.addresses.set([address, ...this.addresses()]))
    );
  }

  updateAddress(id: number, payload: AddressPayload): Observable<Address> {
    return this.http.put<Address>(`${API_BASE_URL}/api/addresses/${id}`, payload).pipe(
      tap((address) =>
        this.addresses.set(this.addresses().map((entry) => (entry.id === id ? address : entry)))
      )
    );
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/addresses/${id}`).pipe(
      tap(() => this.addresses.set(this.addresses().filter((address) => address.id !== id)))
    );
  }
}
