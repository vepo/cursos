import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const jwtHelper = inject(JwtHelperService);

  const token = authService.getToken();

  if (!token || jwtHelper.isTokenExpired(token)) {
    if (token) {
      authService.logout();
    }
    void router.navigate(['/login']);
    return false;
  }

  return true;
};
