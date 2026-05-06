import { Component, input } from '@angular/core';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="panel-dark flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center">
      <span class="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <app-icon [name]="icon()" [size]="24" className="text-zinc-300" />
      </span>
      <div class="space-y-2">
        <h3 class="text-xl font-semibold text-white">{{ title() }}</h3>
        <p class="max-w-md text-sm leading-6 text-zinc-400">{{ message() }}</p>
      </div>
      <ng-content />
    </div>
  `
})
export class EmptyStateComponent {
  readonly icon = input('package');
  readonly title = input('Nothing here yet');
  readonly message = input('Content will appear here as soon as it becomes available.');
}
