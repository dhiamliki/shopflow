import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavSection } from '../../core/models/ui.models';
import { SidebarNavComponent } from '../../shared/components/sidebar-nav/sidebar-nav.component';
import { TopNavComponent } from '../../shared/components/top-nav/top-nav.component';

@Component({
  selector: 'app-account-shell',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent, SidebarNavComponent],
  template: `
    <div class="min-h-screen bg-black text-white">
      <app-top-nav mode="shop" />

      <div class="mx-auto max-w-[1800px] lg:pl-[270px]">
        <aside
          class="hidden lg:fixed lg:bottom-0 lg:left-0 lg:top-[78px] lg:block lg:w-[270px] lg:border-r lg:border-white/10 lg:bg-black lg:px-4 lg:py-6"
        >
          <div class="h-full overflow-y-auto pr-1">
            <app-sidebar-nav [sections]="sections" />
          </div>
        </aside>

        <section class="min-w-0 px-4 py-7 lg:px-8">
          <router-outlet />
        </section>
      </div>
    </div>
  `
})
export class AccountShellComponent {
  readonly sections: NavSection[] = [
    {
      label: 'My Account',
      items: [
        { label: 'Dashboard', route: '/account/dashboard', icon: 'dashboard' },
        { label: 'Orders', route: '/account/orders', icon: 'package' },
        { label: 'Account Settings', route: '/account/settings', icon: 'settings' }
      ]
    }
  ];
}
