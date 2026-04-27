import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div class="w-full max-w-[440px]">
        <div class="text-center space-y-3 mb-10">
          <h1 class="font-display text-4xl font-semibold text-white">Welcome back</h1>
          <p class="text-zinc-400">Log in to your ShopFlow account</p>
        </div>

        <form class="panel-dark p-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="submitLogin()">
          <div class="space-y-5">
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Email address</span>
              <input class="input-dark" formControlName="email" placeholder="Enter your email" />
            </label>

            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Password</span>
              <input class="input-dark" type="password" formControlName="password" placeholder="Enter your password" />
            </label>

            <div class="flex items-center justify-between text-sm">
              <label class="inline-flex items-center gap-3 text-zinc-300">
                <input type="checkbox" class="accent-emerald-400" formControlName="remember" />
                Remember me
              </label>
              <button type="button" class="text-zinc-300 hover:text-white">Forgot password?</button>
            </div>
          </div>

          @if (loginError()) {
            <p class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {{ loginError() }}
            </p>
          }

          <button type="submit" class="button-primary w-full" [disabled]="loginPending()">
            {{ loginPending() ? 'Logging in...' : 'Log in' }}
          </button>

          <div class="relative flex items-center gap-4 text-sm text-zinc-600">
            <span class="h-px flex-1 bg-white/10"></span>
            or continue with
            <span class="h-px flex-1 bg-white/10"></span>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            @for (provider of socialProviders; track provider) {
              <button type="button" class="button-secondary w-full">{{ provider }}</button>
            }
          </div>

          <p class="text-center text-zinc-400 pt-6">
            Don't have an account?
            <a routerLink="/register" class="font-semibold text-white hover:underline">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);

  readonly loginPending = signal(false);
  readonly loginError = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: true
  });

  readonly socialProviders = ['Google', 'Apple', 'Facebook'];

  submitLogin(): void {
    this.loginError.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginPending.set(true);
    this.auth
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.loginPending.set(false)))
      .subscribe({
        next: () => this.handleRedirect(),
        error: () => this.loginError.set('Invalid credentials. Please try again.')
      });
  }

  private handleRedirect(): void {
    const redirect = this.session.isSeller() ? '/seller/dashboard' : '/account/dashboard';
    void this.router.navigateByUrl(redirect);
  }
}
