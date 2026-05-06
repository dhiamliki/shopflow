import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { SellerDashboard } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getSellerDashboard(): Observable<SellerDashboard | null> {
    return this.http
      .get<SellerDashboard>(`${API_BASE_URL}/api/dashboard/seller`)
      .pipe(catchError(() => of(null)));
  }
}
