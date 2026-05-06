import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-seller-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent],
  template: `
    <div class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-4xl font-semibold tracking-tight text-white">Seller Settings</h1>
        <p class="text-sm text-zinc-400">Update store details shown on your public Shopflow store page.</p>
      </header>

      @if (settings(); as sellerSettings) {
        <form class="panel-dark space-y-5 p-6 xl:max-w-3xl" [formGroup]="form" (ngSubmit)="save()">
          <label class="block space-y-2">
            <span class="text-sm text-zinc-400">Shop name</span>
            <input class="input-dark" formControlName="shopName" />
          </label>

          <label class="block space-y-2">
            <span class="text-sm text-zinc-400">Description</span>
            <textarea class="textarea-dark" rows="5" formControlName="description"></textarea>
          </label>

          <label class="block space-y-2">
            <span class="text-sm text-zinc-400">Logo URL (optional)</span>
            <input class="input-dark" formControlName="logoUrl" />
          </label>

          <div class="grid gap-3 rounded-md border border-white/10 bg-white/[0.02] p-4 text-sm sm:grid-cols-3">
            <div>
              <p class="text-zinc-500">Seller</p>
              <p class="mt-1 text-white">{{ sellerSettings.sellerName }}</p>
            </div>
            <div>
              <p class="text-zinc-500">Email</p>
              <p class="mt-1 text-white">{{ sellerSettings.email }}</p>
            </div>
            <div>
              <p class="text-zinc-500">Rating</p>
              <p class="mt-1 text-white">{{ sellerSettings.rating | number: '1.1-1' }}</p>
            </div>
          </div>

          @if (error()) {
            <p class="text-sm text-rose-300">{{ error() }}</p>
          }
          @if (success()) {
            <p class="text-sm text-emerald-300">{{ success() }}</p>
          }

          <div class="flex justify-end">
            <button type="submit" class="button-primary min-h-10 px-5 text-sm" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </form>
      } @else {
        <app-empty-state icon="store" title="Unable to load seller settings" message="Please refresh this page." />
      }
    </div>
  `
})
export class SellerSettingsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  readonly settings = toSignal(this.accountService.getSellerSettings(), { initialValue: null });
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly form = this.fb.nonNullable.group({
    shopName: ['', Validators.required],
    description: [''],
    logoUrl: ['']
  });

  constructor() {
    effect(() => {
      const settings = this.settings();
      if (!settings) return;
      this.form.patchValue(
        {
          shopName: settings.shopName,
          description: settings.description ?? '',
          logoUrl: settings.logoUrl ?? ''
        },
        { emitEvent: false }
      );
    });
  }

  save(): void {
    this.error.set('');
    this.success.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please provide a valid shop name.');
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.accountService
      .updateSellerSettings({
        shopName: value.shopName.trim(),
        description: value.description.trim() || null,
        logoUrl: value.logoUrl.trim() || null
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.success.set('Seller settings updated successfully.');
          this.form.patchValue(
            {
              shopName: updated.shopName,
              description: updated.description ?? '',
              logoUrl: updated.logoUrl ?? ''
            },
            { emitEvent: false }
          );
        },
        error: (error: unknown) => {
          const response = (error as { error?: { message?: string; details?: string[] } } | null)?.error;
          if (response?.details?.length) {
            this.error.set(response.details.join(' '));
            return;
          }
          this.error.set(response?.message ?? 'Unable to update seller settings.');
        }
      });
  }
}
