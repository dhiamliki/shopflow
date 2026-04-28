import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UserRole } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="sf-page py-8">
      <div class="panel-dark grid min-h-[760px] overflow-hidden lg:grid-cols-[0.58fr,0.42fr]">
        <form class="mx-auto flex w-full max-w-[560px] flex-col justify-center space-y-6 p-8" [formGroup]="registerForm" (ngSubmit)="submitSignup()">
          <div class="space-y-3">
            <h1 class="font-display text-4xl font-semibold tracking-[-0.04em] text-white">Create your account</h1>
            <p class="text-zinc-400">Join Shopflow and start your journey</p>
          </div>
          <div class="flex rounded-full border border-white/12 bg-white/[0.04] p-1">
            <button
              type="button"
              class="flex-1 rounded-full py-2.5 text-sm font-semibold transition"
              [ngClass]="role() === 'CUSTOMER' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'"
              (click)="setRole('CUSTOMER')"
            >
              Buyer
            </button>
            <button
              type="button"
              class="flex-1 rounded-full py-2.5 text-sm font-semibold transition"
              [ngClass]="role() === 'SELLER' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'"
              (click)="setRole('SELLER')"
            >
              Seller
            </button>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">First name</span>
              <input class="input-dark" formControlName="firstName" placeholder="Enter your first name" />
            </label>
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Last name</span>
              <input class="input-dark" formControlName="lastName" placeholder="Enter your last name" />
            </label>
          </div>

          <label class="block space-y-3">
            <span class="text-sm font-semibold text-zinc-300">Email address</span>
            <input class="input-dark" formControlName="email" placeholder="Enter your email" />
          </label>

          @if (role() === 'SELLER') {
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
          }

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Password</span>
              <span class="relative block">
                <input class="input-dark pr-12" type="password" formControlName="password" placeholder="Create a password" />
                <app-icon name="eye" [size]="17" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              </span>
            </label>
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Confirm password</span>
              <span class="relative block">
                <input class="input-dark pr-12" type="password" formControlName="confirmPassword" placeholder="Confirm your password" />
                <app-icon name="eye" [size]="17" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              </span>
            </label>
          </div>

          <label class="inline-flex items-center gap-3 text-sm text-zinc-300">
            <input type="checkbox" class="accent-emerald-400" formControlName="agree" />
            I agree to the Terms of Service and Privacy Policy
          </label>

          @if (signupError()) {
            <p class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {{ signupError() }}
            </p>
          }

          <button type="submit" class="button-primary w-full text-lg" [disabled]="signupPending()">
            {{ signupPending() ? 'Creating account...' : (role() === 'SELLER' ? 'Create seller account' : 'Create account') }}
          </button>

          <p class="text-center text-zinc-400 pt-2">
            Already have an account?
            <a routerLink="/login" class="font-semibold text-white hover:underline">Log in</a>
          </p>
        </form>

        <div
          class="hidden border-l border-white/10 bg-cover bg-center grayscale lg:block"
          style="background-image: linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.54)), url('https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&q=80');"
        ></div>
      </div>
    </div>
  `
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);

  readonly signupPending = signal(false);
  readonly signupError = signal('');
  readonly role = signal<UserRole>('CUSTOMER');

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    shopName: [''],
    shopDescription: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    agree: [true, Validators.requiredTrue]
  });

  setRole(role: UserRole): void {
    this.role.set(role);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { role },
      queryParamsHandling: 'merge'
    });
  }

  submitSignup(): void {
    this.signupError.set('');
    const value = this.registerForm.getRawValue();

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (value.password !== value.confirmPassword) {
      this.signupError.set('Your passwords do not match.');
      return;
    }

    if (this.role() === 'SELLER' && !value.shopName.trim()) {
      this.signupError.set('Enter your shop name to create a seller account.');
      return;
    }

    this.signupPending.set(true);
    this.auth
      .register({
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: value.password,
        role: this.role(),
        shopName: this.role() === 'SELLER' ? value.shopName.trim() : null,
        shopDescription: this.role() === 'SELLER' ? value.shopDescription.trim() || null : null,
        shopLogoUrl: null
      })
      .pipe(finalize(() => this.signupPending.set(false)))
      .subscribe({
        next: () => this.finishAuthRedirect(),
        error: () => this.signupError.set('We could not create your account. Try a different email or a stronger password.')
      });
  }

  private finishAuthRedirect(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    if (redirect) {
      void this.router.navigateByUrl(redirect);
      return;
    }
    void this.router.navigateByUrl(this.session.isSeller() ? '/seller/dashboard' : '/account/dashboard');
  }
}
