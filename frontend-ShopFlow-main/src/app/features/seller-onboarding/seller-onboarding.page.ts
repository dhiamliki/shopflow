import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-seller-onboarding-page',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <section class="mx-auto max-w-[1680px] px-4 py-10 lg:px-8">
      <div class="mx-auto max-w-[640px]">
        <div class="text-center space-y-4 mb-10">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-emerald-500/10">
            <app-icon name="store" [size]="28" className="text-emerald-400" />
          </div>
          <h1 class="font-display text-4xl font-semibold text-white">Become a Seller</h1>
          <p class="text-lg text-zinc-400">
            Upgrade your account to start selling on ShopFlow. It only takes a few minutes!
          </p>
        </div>

        <div class="panel-dark p-8 space-y-6">
          <div class="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <div class="flex items-start gap-4">
              <app-icon name="circle-check" [size]="20" className="text-emerald-400 mt-0.5" />
              <div>
                <p class="font-semibold text-emerald-200">Your account</p>
                <p class="text-sm text-emerald-200/70">{{ session.user()?.email }}</p>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Shop name</span>
              <input class="input-dark" formControlName="shopName" placeholder="Your store name" />
            </label>
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Shop description</span>
              <input class="input-dark" formControlName="shopDescription" placeholder="Brief description" />
            </label>
          </div>

          <div class="space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <p class="text-sm font-semibold text-zinc-300">What will you sell?</p>
            <div class="grid gap-3 sm:grid-cols-2">
              @for (category of categories; track category) {
                <label class="flex items-center gap-3 rounded-xl border border-white/10 p-3 cursor-pointer hover:border-white/20 transition">
                  <input type="checkbox" class="accent-emerald-400" (change)="toggleCategory(category)" [checked]="selectedCategories().includes(category)" />
                  <span class="text-sm text-zinc-300">{{ category }}</span>
                </label>
              }
            </div>
          </div>

          @if (error()) {
            <p class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {{ error() }}
            </p>
          }

          <div class="flex gap-4">
            <button type="button" (click)="cancel()" class="button-secondary flex-1">
              Cancel
            </button>
            <button type="button" (click)="submit()" class="button-primary flex-1" [disabled]="pending()">
              {{ pending() ? 'Setting up...' : 'Become a Seller' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class SellerOnboardingPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly session = inject(SessionService);

  readonly pending = signal(false);
  readonly error = signal('');
  readonly selectedCategories = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    shopName: ['', Validators.required],
    shopDescription: ['']
  });

  readonly categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Books',
    'Collectibles',
    'Art',
    'Other'
  ];

  toggleCategory(category: string): void {
    const current = this.selectedCategories();
    if (current.includes(category)) {
      this.selectedCategories.set(current.filter(c => c !== category));
    } else {
      this.selectedCategories.set([...current, category]);
    }
  }

  cancel(): void {
    void this.router.navigate(['/account/dashboard']);
  }

  submit(): void {
    this.error.set('');
    const value = this.form.getRawValue();

    if (!value.shopName.trim()) {
      this.error.set('Please enter your shop name.');
      return;
    }

    this.pending.set(true);

    // Update user to seller role via API
    this.auth
      .updateToSeller({
        shopName: value.shopName.trim(),
        shopDescription: value.shopDescription?.trim() || null,
        categories: this.selectedCategories()
      })
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          // Update local session with new role
          this.session.patchUser({ role: 'SELLER' });
          void this.router.navigate(['/seller/dashboard']);
        },
        error: () => {
          this.error.set('Failed to upgrade account. Please try again.');
        }
      });
  }
}