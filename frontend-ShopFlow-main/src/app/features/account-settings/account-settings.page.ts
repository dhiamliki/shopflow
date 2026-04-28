import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdersService } from '../../core/services/orders.service';
import { SessionService } from '../../core/services/session.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, PanelCardComponent, SectionHeadingComponent],
  template: `
    <div class="space-y-6">
      <app-section-heading
        title="Account Settings"
        subtitle="Manage your account information and preferences."
      />

      <div class="flex flex-wrap gap-8 border-b border-white/8">
        @for (tab of tabs; track tab) {
          <button type="button" class="relative pb-5 text-lg font-medium" [ngClass]="tab === 'Profile Information' ? 'text-emerald-300' : 'text-zinc-400 hover:text-white'">
            {{ tab }}
            @if (tab === 'Profile Information') {
              <span class="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-400"></span>
            }
          </button>
        }
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr,340px]">
        <section class="space-y-5">
          <app-panel-card title="Profile Information" subtitle="Update your personal information.">
            <form class="grid gap-5 xl:grid-cols-[160px,1fr]" [formGroup]="profileForm">
              <div class="space-y-4">
                <div class="relative h-36 w-36 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
                  <div class="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                    {{ initials() }}
                  </div>
                </div>
                <button type="button" class="button-secondary w-full justify-center">Update Photo</button>
              </div>

              <div class="space-y-5">
                <div class="grid gap-4 sm:grid-cols-2">
                  <input class="input-dark" formControlName="firstName" placeholder="First Name" />
                  <input class="input-dark" formControlName="lastName" placeholder="Last Name" />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <input class="input-dark" formControlName="email" placeholder="Email Address" />
                  <input class="input-dark" formControlName="phoneNumber" placeholder="Phone Number" />
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <input class="input-dark" type="date" formControlName="dateOfBirth" />
                  <select class="select-dark" formControlName="gender">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <textarea class="textarea-dark" formControlName="bio" placeholder="Tell us about yourself"></textarea>
                <div class="flex justify-end">
                  <button type="button" class="button-primary px-8" (click)="saveProfile()">Save Changes</button>
                </div>
              </div>
            </form>
          </app-panel-card>

          <app-panel-card title="Change Password" subtitle="Make sure to use a strong password.">
            <form class="space-y-5" [formGroup]="passwordForm">
              <div class="grid gap-4 md:grid-cols-3">
                <input class="input-dark" type="password" formControlName="currentPassword" placeholder="Current Password" />
                <input class="input-dark" type="password" formControlName="newPassword" placeholder="New Password" />
                <input class="input-dark" type="password" formControlName="confirmPassword" placeholder="Confirm New Password" />
              </div>
              @if (passwordMessage()) {
                <p class="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
                  {{ passwordMessage() }}
                </p>
              }
              <div class="flex justify-end">
                <button type="button" class="button-primary px-8" (click)="updatePassword()">Update Password</button>
              </div>
            </form>
          </app-panel-card>
        </section>

        <aside class="space-y-5">
          <app-panel-card title="Account Overview">
            <div class="space-y-4 text-base">
              <div class="flex items-center justify-between">
                <span class="text-zinc-400">Member Since</span>
                <span class="text-white">Unavailable</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-zinc-400">Account Type</span>
                <span class="rounded-full bg-emerald-500/14 px-3 py-1 text-sm font-semibold text-emerald-300">{{ accountType() }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-zinc-400">Total Orders</span>
                <span class="text-white">{{ totalOrders() }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-zinc-400">Total Spent</span>
                <span class="text-white">{{ totalSpent() | currency: 'USD' : 'symbol' : '1.2-2' }}</span>
              </div>
            </div>
            <button type="button" class="button-secondary mt-6 w-full justify-center">View Order History</button>
          </app-panel-card>

          <app-panel-card title="Email Preferences" subtitle="Choose what types of emails you want to receive.">
            <div class="space-y-4">
              @for (preference of workspace.notificationPreferences(); track preference.key) {
                <label class="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <input type="checkbox" class="mt-1 h-5 w-5 accent-emerald-400" [checked]="preference.enabled" (change)="workspace.toggleNotificationPreference(preference.key)" />
                  <span>
                    <span class="block text-lg font-semibold text-white">{{ preference.label }}</span>
                    <span class="mt-1 block text-sm leading-6 text-zinc-400">{{ preference.description }}</span>
                  </span>
                </label>
              }
            </div>
            <button type="button" class="button-secondary mt-6 w-full justify-center">Save Preferences</button>
          </app-panel-card>

          <app-panel-card title="Delete Account">
            <p class="text-sm leading-7 text-zinc-400">Once you delete your account, there is no going back. Please be certain.</p>
            <button type="button" class="mt-6 inline-flex w-full justify-center rounded-2xl border border-rose-400/30 px-5 py-3 text-base font-semibold text-rose-300 transition hover:bg-rose-500/10">
              Delete My Account
            </button>
          </app-panel-card>
        </aside>
      </div>
    </div>
  `
})
export class AccountSettingsPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly workspace = inject(WorkspaceService);
  private readonly session = inject(SessionService);
  private readonly orders = inject(OrdersService);

  readonly tabs = ['Profile Information', 'Security', 'Notifications', 'Privacy', 'Saved Cards', 'Connected Accounts'];
  readonly passwordMessage = signal('');
  readonly orderList = toSignal(this.orders.loadMyOrders(), { initialValue: [] });

  readonly profileForm = this.fb.nonNullable.group({
    firstName: [this.workspace.profileDraft().firstName, Validators.required],
    lastName: [this.workspace.profileDraft().lastName, Validators.required],
    email: [this.workspace.profileDraft().email, [Validators.required, Validators.email]],
    phoneNumber: [this.workspace.profileDraft().phoneNumber],
    dateOfBirth: [this.workspace.profileDraft().dateOfBirth],
    gender: [this.workspace.profileDraft().gender],
    bio: [this.workspace.profileDraft().bio]
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: [''],
    newPassword: [''],
    confirmPassword: ['']
  });

  readonly totalOrders = computed(() => this.orderList().length);
  readonly totalSpent = computed(() => this.orderList().reduce((total, order) => total + order.totalAmount, 0));
  readonly accountType = computed(() =>
    this.session.isSeller() ? 'Seller' : this.session.isCustomer() ? 'Buyer' : 'Member'
  );
  readonly initials = computed(() =>
    `${this.session.user()?.firstName?.[0] ?? ''}${this.session.user()?.lastName?.[0] ?? ''}`.toUpperCase() || 'SF'
  );

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.workspace.saveProfile(this.profileForm.getRawValue());
  }

  updatePassword(): void {
    const value = this.passwordForm.getRawValue();
    if (!value.newPassword || value.newPassword !== value.confirmPassword) {
      this.passwordMessage.set('Make sure your new password matches the confirmation field.');
      return;
    }

    this.passwordMessage.set('Your password update is saved locally for now.');
  }
}
