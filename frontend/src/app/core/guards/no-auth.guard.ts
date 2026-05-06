import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const noAuthGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (!session.isAuthenticated()) {
    return true;
  }

  // Redirect authenticated users based on their role
  const redirectUrl = session.isSeller() ? '/seller/dashboard' : '/account/dashboard';
  return router.createUrlTree([redirectUrl]);
};
