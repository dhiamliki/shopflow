import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { OrdersService } from '../../core/services/orders.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { TndCurrencyPipe } from '../../shared/pipes/tnd-currency.pipe';

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PanelCardComponent, EmptyStateComponent, TndCurrencyPipe],
  template: `
    <div class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-4xl font-semibold tracking-tight text-white">Account Settings</h1>
        <p class="text-sm text-zinc-400">Manage your account details and credentials.</p>
      </header>

      @if (profile(); as account) {
        <div class="grid gap-6 xl:grid-cols-[1fr,320px]">
          <section class="space-y-6">
            <form class="panel-dark space-y-5 p-6" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <h2 class="text-xl font-semibold text-white">Profile Information</h2>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="space-y-2">
                  <span class="text-sm text-zinc-400">First name</span>
                  <input class="input-dark" formControlName="firstName" />
                </label>
                <label class="space-y-2">
                  <span class="text-sm text-zinc-400">Last name</span>
                  <input class="input-dark" formControlName="lastName" />
                </label>
              </div>
              <label class="space-y-2 block">
                <span class="text-sm text-zinc-400">Email</span>
                <input class="input-dark" formControlName="email" type="email" readonly />
                <span class="text-xs text-zinc-500">Email changes are not supported from settings.</span>
              </label>
              @if (profileError()) {
                <p class="text-sm text-rose-300">{{ profileError() }}</p>
              }
              @if (profileSuccess()) {
                <p class="text-sm text-emerald-300">{{ profileSuccess() }}</p>
              }
              <div class="flex justify-end">
                <button type="submit" class="button-primary min-h-10 px-5 text-sm" [disabled]="savingProfile()">
                  {{ savingProfile() ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>

            <form class="panel-dark space-y-5 p-6" [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
              <h2 class="text-xl font-semibold text-white">Change Password</h2>
              <label class="space-y-2 block">
                <span class="text-sm text-zinc-400">Current password</span>
                <input class="input-dark" formControlName="currentPassword" type="password" />
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="space-y-2">
                  <span class="text-sm text-zinc-400">New password</span>
                  <input class="input-dark" formControlName="newPassword" type="password" />
                </label>
                <label class="space-y-2">
                  <span class="text-sm text-zinc-400">Confirm new password</span>
                  <input class="input-dark" formControlName="confirmPassword" type="password" />
                </label>
              </div>
              @if (passwordError()) {
                <p class="text-sm text-rose-300">{{ passwordError() }}</p>
              }
              @if (passwordSuccess()) {
                <p class="text-sm text-emerald-300">{{ passwordSuccess() }}</p>
              }
              <div class="flex justify-end">
                <button type="submit" class="button-primary min-h-10 px-5 text-sm" [disabled]="savingPassword()">
                  {{ savingPassword() ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </form>
          </section>

          <aside class="space-y-5">
            <app-panel-card title="Account Overview">
              <div class="space-y-3 text-sm">
                <div class="flex justify-between gap-4">
                  <span class="text-zinc-400">Member since</span>
                  <span class="text-white">{{ account.createdAt | date: 'mediumDate' }}</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-zinc-400">Account type</span>
                  <span class="text-white">{{ account.role }}</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-zinc-400">Total orders</span>
                  <span class="text-white">{{ orderCount() }}</span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-zinc-400">Total spent</span>
                  <span class="text-white">{{ totalSpent() | tndCurrency }}</span>
                </div>
              </div>
            </app-panel-card>
          </aside>
        </div>
      } @else {
        <app-empty-state icon="user" title="Unable to load account profile" message="Please refresh this page." />
      }
    </div>
  `
})
export class AccountSettingsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly ordersService = inject(OrdersService);

  readonly profile = toSignal(this.accountService.getProfile(), { initialValue: null });
  readonly orders = toSignal(this.ordersService.loadMyOrders(), { initialValue: [] });

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly profileError = signal('');
  readonly profileSuccess = signal('');
  readonly passwordError = signal('');
  readonly passwordSuccess = signal('');

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly orderCount = computed(() => this.orders().length);
  readonly totalSpent = computed(() =>
    this.orders().reduce((sum, order) => sum + order.totalAmount, 0)
  );

  constructor() {
    effect(() => {
      const account = this.profile();
      if (!account) return;
      this.profileForm.patchValue(
        {
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email
        },
        { emitEvent: false }
      );
    });
  }

  saveProfile(): void {
    this.profileError.set('');
    this.profileSuccess.set('');
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.profileError.set('Please provide valid profile information.');
      return;
    }

    const value = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.accountService
      .updateProfile({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim().toLowerCase()
      })
      .pipe(finalize(() => this.savingProfile.set(false)))
      .subscribe({
        next: () => {
          this.profileSuccess.set('Profile updated successfully.');
        },
        error: (error: unknown) => {
          this.profileError.set(this.readError(error, 'Unable to update profile.'));
        }
      });
  }

  updatePassword(): void {
    this.passwordError.set('');
    this.passwordSuccess.set('');
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.passwordError.set('Please provide valid password fields.');
      return;
    }

    const value = this.passwordForm.getRawValue();
    if (value.newPassword !== value.confirmPassword) {
      this.passwordError.set('New password and confirmation do not match.');
      return;
    }

    this.savingPassword.set(true);
    this.accountService
      .changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword
      })
      .pipe(finalize(() => this.savingPassword.set(false)))
      .subscribe({
        next: () => {
          this.passwordSuccess.set('Password updated successfully.');
          this.passwordForm.reset();
        },
        error: (error: unknown) => {
          this.passwordError.set(this.readError(error, 'Unable to update password.'));
        }
      });
  }

  private readError(error: unknown, fallback: string): string {
    const response = (error as { error?: { message?: string; details?: string[] } } | null)?.error;
    if (response?.details?.length) {
      return response.details.join(' ');
    }
    if (typeof response?.message === 'string' && response.message.trim()) {
      return response.message;
    }
    return fallback;
  }
}
