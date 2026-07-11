import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthTokenService } from '../services/auth-token.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AuthTokenService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        tokenService.clearToken();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
