import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AccountProfile,
  ChangePasswordPayload,
  SellerSettings,
  UpdateAccountProfilePayload,
  UpdateSellerSettingsPayload
} from '../models/account.models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  getProfile(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>(`${API_BASE_URL}/api/account/profile`);
  }

  updateProfile(payload: UpdateAccountProfilePayload): Observable<AccountProfile> {
    return this.http.put<AccountProfile>(`${API_BASE_URL}/api/account/profile`, payload).pipe(
      tap((profile) => {
        this.session.patchUser({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      })
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${API_BASE_URL}/api/account/password`, payload);
  }

  getSellerSettings(): Observable<SellerSettings> {
    return this.http.get<SellerSettings>(`${API_BASE_URL}/api/account/seller-settings`);
  }

  updateSellerSettings(payload: UpdateSellerSettingsPayload): Observable<SellerSettings> {
    return this.http.put<SellerSettings>(`${API_BASE_URL}/api/account/seller-settings`, payload);
  }
}
