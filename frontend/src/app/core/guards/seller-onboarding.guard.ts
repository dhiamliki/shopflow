import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

/**
 * Guard for authenticated seller onboarding/conversion flow.
 * - Allows authenticated CUSTOMERS to proceed with seller conversion
 * - Redirects existing SELLERS to their dashboard
 * - Redirects unauthenticated users to login
 */
export const sellerOnboardingGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  // Not authenticated: redirect to login
  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirect: state.url }
    });
  }

  // Already a seller: redirect to seller dashboard
  if (session.isSeller()) {
    return router.createUrlTree(['/seller/dashboard']);
  }

  // Authenticated customer: allow access to onboarding
  return true;
};
