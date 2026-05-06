import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { TopNavComponent, TopNavMode } from '../../shared/components/top-nav/top-nav.component';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent],
  template: `
    <div class="min-h-screen bg-black text-white">
      <app-top-nav [mode]="navMode()" />
      <main>
        <router-outlet />
      </main>
    </div>
  `
})
export class PublicShellComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly navMode = signal<TopNavMode>('marketing');

  constructor() {
    this.updateMode();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.updateMode());
  }

  private updateMode(): void {
    let current = this.route.firstChild;

    while (current?.firstChild) {
      current = current.firstChild;
    }

    this.navMode.set((current?.snapshot?.data?.['navMode'] as TopNavMode | undefined) ?? 'marketing');
  }
}
