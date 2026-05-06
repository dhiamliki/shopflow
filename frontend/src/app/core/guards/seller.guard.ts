import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

export const sellerGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.role() === 'SELLER' || session.role() === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/sell']);
};
