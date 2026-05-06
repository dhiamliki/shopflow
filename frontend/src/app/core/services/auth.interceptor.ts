import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const authService = inject(AuthService);

  if (!request.url.startsWith(API_BASE_URL)) {
    return next(request);
  }

  const isAuthRequest = request.url.includes('/api/auth/');
  const accessToken = session.accessToken();
  const authorizedRequest =
    accessToken && !isAuthRequest
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        })
      : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      const refreshToken = session.refreshToken();

      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthRequest ||
        !refreshToken
      ) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((nextToken) =>
          next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${nextToken}`
              }
            })
          )
        ),
        catchError((refreshError) => {
          session.clearSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
