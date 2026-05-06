import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  UpdateToSellerRequest
} from '../models/auth.models';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  private refreshRequest$: Observable<string> | null = null;

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, payload).pipe(
      tap((response) => this.session.setSession(response))
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, payload).pipe(
      tap((response) => this.session.setSession(response))
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    const refreshToken = this.session.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available.'));
    }

    const payload: RefreshTokenRequest = { refreshToken };

    this.refreshRequest$ = this.http
      .post<AuthResponse>(`${API_BASE_URL}/api/auth/refresh`, payload)
      .pipe(
        tap((response) => this.session.setSession(response)),
        map((response) => response.accessToken),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay(1)
      );

    return this.refreshRequest$;
  }

  logout(redirect = true): Observable<null> {
    const refreshToken = this.session.refreshToken();

    const request$: Observable<unknown> = refreshToken
      ? this.http.post<unknown>(`${API_BASE_URL}/api/auth/logout`, { refreshToken })
      : of(null);

    return request$.pipe(
      catchError(() => of(null)),
      tap(() => {
        this.session.clearSession();
        if (redirect) {
          void this.router.navigateByUrl('/');
        }
      }),
      map(() => null)
    );
  }

  logoutAndForget(): void {
    this.logout().subscribe();
  }

  updateToSeller(payload: UpdateToSellerRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/update-role`, payload).pipe(
      tap((response) => this.session.setSession(response))
    );
  }
}
