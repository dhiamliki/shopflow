import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models/commerce.models';
import { GlowSurfaceDirective } from '../../directives/glow-surface.directive';
import { IconComponent } from '../icon.component';

const CATEGORY_ICONS: Record<string, string> = {
  Fashion: 'bag',
  Electronics: 'dashboard',
  'Home & Living': 'home',
  Accessories: 'bag',
  Sports: 'star',
  Beauty: 'sparkles',
  Books: 'receipt',
  'More Categories': 'grid'
};

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [RouterLink, GlowSurfaceDirective, IconComponent],
  template: `
    <a
      appGlowSurface
      [routerLink]="['/browse']"
      [queryParams]="{ categoryId: category().id }"
      class="panel-dark group flex h-full flex-col overflow-hidden p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5"
    >
      <div class="relative aspect-[1.18/1] overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.03]">
        @if (categoryImage()) {
          <img
            class="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
            [src]="categoryImage()"
            [alt]="category().name"
          />
        } @else {
          <div class="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_54%),linear-gradient(160deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))]"></div>
        }
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <span
          class="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/45 backdrop-blur"
        >
          <app-icon [name]="iconName()" [size]="18" className="text-white" />
        </span>
      </div>

      <div class="mt-5 flex flex-1 flex-col">
        <h3 class="text-[1.45rem] font-semibold text-white">{{ category().name }}</h3>
        <p class="mt-3 text-sm leading-7 text-zinc-400">
          {{ category().description }}
        </p>

        <div class="mt-4 flex items-center justify-between text-sm text-zinc-300">
          @if (itemCount() !== null) {
            <span>{{ itemCount() }} items</span>
          } @else {
            <span>Browse category</span>
          }
          <app-icon
            name="arrow-right"
            [size]="18"
            className="text-zinc-500 transition duration-200 group-hover:text-white"
          />
        </div>
      </div>
    </a>
  `
})
export class CategoryCardComponent {
  readonly category = input.required<Category>();
  readonly count = input<number | null>(null);
  readonly image = input<string | null>(null);

  readonly iconName = computed(
    () => CATEGORY_ICONS[this.category().name] ?? CATEGORY_ICONS['More Categories']
  );

  readonly categoryImage = computed(() => this.image());

  readonly itemCount = computed(() => this.count());
}
