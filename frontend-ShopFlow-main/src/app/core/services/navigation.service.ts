import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);

  /**
   * Navigate to seller flow based on auth state and role:
   * - SELLER → /seller/dashboard
   * - CUSTOMER → /seller/onboarding (authenticated seller conversion)
   * - NOT logged in → /register?role=SELLER
   */
  navigateToSelling(): void {
    if (this.session.isSeller()) {
      // Already a seller: go to seller dashboard
      void this.router.navigate(['/seller/dashboard']);
      return;
    }

    if (this.session.isAuthenticated()) {
      // Logged in as customer: go to seller onboarding (conversion flow)
      void this.router.navigate(['/seller/onboarding']);
      return;
    }

    // Not logged in: go to seller registration
    void this.router.navigate(['/register'], { queryParams: { role: 'SELLER' } });
  }
}
