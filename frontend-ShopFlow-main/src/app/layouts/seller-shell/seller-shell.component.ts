import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavSection } from '../../core/models/ui.models';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { SidebarNavComponent } from '../../shared/components/sidebar-nav/sidebar-nav.component';
import { TopNavComponent } from '../../shared/components/top-nav/top-nav.component';

const SELLER_SECTIONS: NavSection[] = [
  {
    label: 'Seller Hub',
    items: [
      { label: 'Dashboard', route: '/seller/dashboard', icon: 'dashboard' },
      { label: 'Create Listing', route: '/seller/create-listing', icon: 'plus' },
      { label: 'Settings', route: '/account/settings', icon: 'settings' }
    ]
  }
];

@Component({
  selector: 'app-seller-shell',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent, SidebarNavComponent, PanelCardComponent],
  template: `
    <div class="min-h-screen bg-black text-white">
      <app-top-nav mode="seller" />

      <div class="mx-auto grid max-w-[1750px] gap-6 px-4 py-6 lg:grid-cols-[238px,1fr] lg:px-8">
        <aside class="space-y-6">
          <div class="sticky top-28 space-y-6">
            <app-sidebar-nav [sections]="sections" />

            <app-panel-card
              title="Need Help?"
              subtitle="We are here to help you with selling, payouts, and storefront setup."
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
export class SellerShellComponent {
  readonly sections = SELLER_SECTIONS;
}
