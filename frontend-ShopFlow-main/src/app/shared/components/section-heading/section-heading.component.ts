import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-[2.55rem]">
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="max-w-2xl text-base leading-7 text-zinc-400">
            {{ subtitle() }}
          </p>
        }
      </div>

      <ng-content />
    </div>
  `
})
export class SectionHeadingComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
