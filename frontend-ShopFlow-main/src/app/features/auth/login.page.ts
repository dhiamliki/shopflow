import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="sf-page py-8">
      <div class="panel-dark grid min-h-[760px] overflow-hidden lg:grid-cols-[0.42fr,0.58fr]">
        <div
          class="hidden border-r border-white/10 bg-cover bg-center grayscale lg:block"
          style="background-image: linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.52)), url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80');"
        ></div>

        <form class="mx-auto flex w-full max-w-[520px] flex-col justify-center space-y-6 p-8" [formGroup]="loginForm" (ngSubmit)="submitLogin()">
          <div class="space-y-3">
            <h1 class="font-display text-4xl font-semibold tracking-[-0.04em] text-white">Welcome back</h1>
            <p class="text-zinc-400">Log in to your Shopflow account</p>
          </div>
          <div class="space-y-5">
            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Email address</span>
              <input class="input-dark" formControlName="email" placeholder="Enter your email" />
            </label>

            <label class="block space-y-3">
              <span class="text-sm font-semibold text-zinc-300">Password</span>
              <span class="relative block">
                <input class="input-dark pr-12" type="password" formControlName="password" placeholder="Enter your password" />
                <app-icon name="eye" [size]="17" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              </span>
            </label>

            <div class="flex items-center justify-between text-sm">
              <label class="inline-flex items-center gap-3 text-zinc-300">
                <input type="checkbox" class="accent-emerald-400" formControlName="remember" />
                Remember me
              </label>
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
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);

  readonly loginPending = signal(false);
  readonly loginError = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: true
  });
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
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    if (redirect) {
      void this.router.navigateByUrl(redirect);
      return;
    }

    const defaultRedirect = this.session.isSeller() ? '/seller/dashboard' : '/account/dashboard';
    void this.router.navigateByUrl(defaultRedirect);
  }
}
