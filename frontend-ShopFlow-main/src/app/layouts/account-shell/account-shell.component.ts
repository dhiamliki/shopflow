import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavSection } from '../../core/models/ui.models';
import { SessionService } from '../../core/services/session.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { SidebarNavComponent } from '../../shared/components/sidebar-nav/sidebar-nav.component';
import { TopNavComponent } from '../../shared/components/top-nav/top-nav.component';

@Component({
  selector: 'app-account-shell',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent, SidebarNavComponent, PanelCardComponent],
  template: `
    <div class="min-h-screen bg-black text-white">
      <app-top-nav mode="shop" />

      <div class="mx-auto grid max-w-[1700px] gap-6 px-4 py-6 lg:grid-cols-[248px,1fr] lg:px-8">
        <aside class="space-y-6">
          <div class="sticky top-28 space-y-6">
            <app-sidebar-nav [sections]="sections()" />

            <app-panel-card
              title="Need Help?"
              subtitle="Our support team is here to help you with orders, returns, and account questions."
            >
              <a href="mailto:support@shopflow.com" class="button-secondary w-full justify-center">
                Contact Support
              </a>
            </app-panel-card>
          </div>
        </aside>

        <section class="min-w-0">
          <router-outlet />
        </section>
      </div>
    </div>
  `
})
export class AccountShellComponent {
  private readonly session = inject(SessionService);
  private readonly workspace = inject(WorkspaceService);

  readonly sections = computed<NavSection[]>(() => {
    const accountSection: NavSection = {
      label: 'My Account',
      items: [
        { label: 'Dashboard', route: '/account/dashboard', icon: 'dashboard' },
        { label: 'Orders', route: '/account/orders', icon: 'package' },
        {
          label: 'Wishlist',
          route: '/account/wishlist',
          icon: 'heart'
        },
        {
          label: 'Notifications',
          route: '/account/notifications',
          icon: 'bell'
        },
        { label: 'Account Settings', route: '/account/settings', icon: 'settings' }
      ]
    };

    const sellerSection: NavSection = this.session.isSeller()
      ? {
          label: 'Seller',
          items: [
            { label: 'Seller Dashboard', route: '/seller/dashboard', icon: 'store' },
            { label: 'Create Listing', route: '/seller/create-listing', icon: 'plus' }
          ]
        }
      : {
          label: 'Seller',
          items: [{ label: 'Start Selling', route: '/seller/onboarding', icon: 'store' }]
        };

    const supportSection: NavSection = {
      label: 'Quick Links',
      items: [
        { label: 'Help Center', route: '/about', icon: 'life' },
        { label: 'Returns & Refunds', route: '/account/orders', icon: 'arrow-left' },
        { label: 'Contact Support', route: '/about', icon: 'headset' }
      ]
    };

    return [accountSection, sellerSection, supportSection];
  });
}
