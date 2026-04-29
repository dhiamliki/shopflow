import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { CategoriesService } from '../../core/services/categories.service';
import { NavigationService } from '../../core/services/navigation.service';
import { CategoryCardComponent } from '../../shared/components/category-card/category-card.component';
import { IconComponent } from '../../shared/components/icon.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CategoryCardComponent,
    IconComponent,
    SectionHeadingComponent,
    EmptyStateComponent
  ],
  template: `
    <section class="sf-page py-12">
      <div class="grid gap-8 xl:grid-cols-[0.9fr,0.58fr] xl:items-end">
        <app-section-heading
          title="Shop by Category"
          subtitle="Find exactly what you're looking for from our wide range of categories."
        />
        <div class="panel-dark flex min-h-16 items-center gap-3 px-5">
          <app-icon name="search" [size]="18" className="text-zinc-500" />
          <input
            [formControl]="searchControl"
            type="text"
            class="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
            placeholder="Search categories..."
          />
        </div>
      </div>

      <div class="mt-8 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-white">All Categories</h2>
        </div>
        @if (filteredCategories().length) {
          <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            @for (category of filteredCategories(); track category.id) {
              <app-category-card [category]="category" />
            }
          </div>
        } @else {
          <app-empty-state
            icon="grid"
            title="No categories found"
            message="Check back later for new categories."
          />
        }
        <div
          class="panel-dark relative overflow-hidden p-6 sm:p-8 lg:flex lg:items-center lg:justify-between"
          style="background:
            linear-gradient(90deg, rgba(255,255,255,0.05), transparent 55%),
            radial-gradient(50rem 18rem at 100% 100%, rgba(255,255,255,0.08), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));"
        >
          <div class="space-y-2">
            <div class="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <app-icon name="chart" [size]="24" className="text-white" />
            </div>
            <h3 class="mt-4 text-3xl font-semibold tracking-tight text-white">Don't see your category?</h3>
            <p class="max-w-2xl text-base leading-7 text-zinc-400">
              Start selling and reach buyers across ShopFlow categories. Create your seller account and list products in minutes.
            </p>
          </div>
          <button type="button" (click)="onStartSelling()" class="button-primary mt-6 px-8 lg:mt-0">
            Start Selling
            <app-icon name="arrow-right" [size]="18" className="text-black" />
          </button>
        </div>
      </div>
    </section>
  `
})
export class CategoriesPageComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly navigation = inject(NavigationService);

  onStartSelling(): void {
    this.navigation.navigateToSelling();
  }

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly categories = toSignal(this.categoriesService.getCategories(), {
    initialValue: []
  });

  readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.getRawValue())),
    { initialValue: this.searchControl.getRawValue() }
  );

  readonly filteredCategories = computed(() => {
    const search = this.searchTerm().toLowerCase();
    return this.categories().filter((category) =>
      `${category.name} ${category.description}`.toLowerCase().includes(search)
    );
  });
}
