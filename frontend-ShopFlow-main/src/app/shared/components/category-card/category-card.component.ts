import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../core/models/commerce.models';
import { GlowSurfaceDirective } from '../../directives/glow-surface.directive';
import { IconComponent } from '../icon.component';

const CATEGORY_ICONS: Record<string, string> = {
  Fashion: 'user',
  Electronics: 'phone',
  'Home & Living': 'home',
  Accessories: 'bag',
  Sports: 'star',
  Beauty: 'sparkles',
  'Kids & Toys': 'grid',
  Books: 'receipt',
  'Books & Stationery': 'receipt',
  Automotive: 'truck',
  'Automotive & Tools': 'truck',
  'More Categories': 'grid'
};

const CATEGORY_IMAGES: Record<string, string> = {
  Fashion: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
  Electronics: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=80',
  'Home & Living': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
  Accessories: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
  Sports: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=900&q=80',
  Beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
  'Kids & Toys': 'https://images.unsplash.com/photo-1618842676088-c4d48a6a7c9d?auto=format&fit=crop&w=900&q=80',
  Books: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
  'Books & Stationery': 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
  Automotive: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  'Automotive & Tools': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
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
      class="panel-dark group flex h-full min-h-[300px] flex-col overflow-hidden p-4 transition-transform duration-200 hover:border-white/20 sm:p-5"
    >
      <div class="sf-image-well relative aspect-[1.42/1] overflow-hidden rounded-md">
        @if (categoryImage()) {
          <img
            class="h-full w-full object-cover opacity-70 grayscale transition duration-300 group-hover:scale-[1.03]"
            [src]="categoryImage()"
            [alt]="category().name"
          />
        } @else {
          <div class="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_54%),linear-gradient(160deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))]"></div>
        }
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <span
          class="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-md border border-white/15 bg-black/45 backdrop-blur"
        >
          <app-icon [name]="iconName()" [size]="18" className="text-white" />
        </span>
      </div>

      <div class="mt-5 flex flex-1 flex-col">
        <h3 class="text-base font-semibold text-white">{{ category().name }}</h3>
        <p class="mt-3 text-sm leading-6 text-zinc-400">
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

  readonly categoryImage = computed(() => this.image() ?? CATEGORY_IMAGES[this.category().name] ?? null);

  readonly itemCount = computed(() => this.count());
}
