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
    <div class="space-y-7">
      @for (section of sections(); track section.label) {
        <section class="space-y-3 border-b border-white/10 pb-6 last:border-b-0">
          @if (section.label) {
            <h2 class="px-1 text-xs font-medium uppercase tracking-normal text-zinc-500">
              {{ section.label }}
            </h2>
          }

          <nav class="space-y-1">
            @for (item of section.items; track item.route) {
              <a
                [routerLink]="item.route"
                class="group relative flex items-center justify-between rounded-md border border-transparent px-3 py-3 text-sm font-medium transition-all duration-200"
                [ngClass]="
                  isActive(item.route, item.exact ?? false)
                    ? 'bg-white/8 text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-emerald-400'
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
                    class="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-300"
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
