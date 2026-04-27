import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavSection } from '../../../core/models/ui.models';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="space-y-6">
      @for (section of sections(); track section.label) {
        <section class="space-y-3">
          <h2 class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {{ section.label }}
          </h2>

          <nav class="space-y-2">
            @for (item of section.items; track item.route) {
              <a
                [routerLink]="item.route"
                class="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm font-medium transition-all duration-200"
                [ngClass]="
                  isActive(item.route, item.exact ?? false)
                    ? 'border-emerald-500/30 bg-white/7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                    : 'text-zinc-300 hover:border-white/10 hover:bg-white/4 hover:text-white'
                "
              >
                <span class="flex items-center gap-3">
                  <app-icon
                    [name]="item.icon"
                    [size]="18"
                    [className]="
                      isActive(item.route, item.exact ?? false)
                        ? 'text-emerald-300'
                        : 'text-zinc-400 group-hover:text-white'
                    "
                  />
                  <span>{{ item.label }}</span>
                </span>

                @if (item.badge) {
                  <span
                    class="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-xs font-semibold text-zinc-300"
                  >
                    {{ item.badge }}
                  </span>
                }
              </a>
            }
          </nav>
        </section>
      }
    </div>
  `
})
export class SidebarNavComponent {
  private readonly router = inject(Router);

  readonly sections = input<NavSection[]>([]);

  isActive(route: string, exact: boolean): boolean {
    return exact ? this.router.url === route : this.router.url.startsWith(route);
  }
}
