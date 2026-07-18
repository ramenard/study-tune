import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthTokenService } from '../services/auth-token.service';
import { AuthService } from '../services/auth.service';

const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthPath = AUTH_PATHS.some((path) => req.url.includes(path));
      const canRefresh =
        error.status === 401 && !isAuthPath && !!tokenService.refreshToken();

      if (!canRefresh) {
        if (error.status === 401 && !isAuthPath) {
          authService.clearSession();
          void router.navigate(['/login']);
        }
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((accessToken) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${accessToken}` },
            }),
          ),
        ),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
