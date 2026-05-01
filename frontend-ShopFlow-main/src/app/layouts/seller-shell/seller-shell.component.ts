import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavSection } from '../../core/models/ui.models';
import { SidebarNavComponent } from '../../shared/components/sidebar-nav/sidebar-nav.component';
import { TopNavComponent } from '../../shared/components/top-nav/top-nav.component';

const SELLER_SECTIONS: NavSection[] = [
  {
    label: '',
    items: [
      { label: 'Dashboard', route: '/seller/dashboard', icon: 'dashboard' },
      { label: 'Create Listing', route: '/seller/create-listing', icon: 'plus' }
    ]
  }
];

@Component({
  selector: 'app-seller-shell',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent, SidebarNavComponent],
  template: `
    <div class="min-h-screen bg-black text-white">
      <app-top-nav mode="seller" />

      <div class="mx-auto grid max-w-[1800px] lg:grid-cols-[270px,1fr]">
        <aside class="hidden border-r border-white/10 px-5 py-8 lg:block">
          <div class="sticky top-28 space-y-6">
            <app-sidebar-nav [sections]="sections" />
          </div>
        </aside>

        <section class="min-w-0 px-4 py-8 lg:px-8">
          <router-outlet />
        </section>
      </div>
    </div>
  `
})
export class SellerShellComponent {
  readonly sections = SELLER_SECTIONS;
}
