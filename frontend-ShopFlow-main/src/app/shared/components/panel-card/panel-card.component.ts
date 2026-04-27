import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-panel-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <section class="panel-dark p-5 sm:p-6" [ngClass]="className()">
      @if (title() || subtitle()) {
        <header class="mb-4">
          @if (title()) {
            <h3 class="text-xl font-semibold text-white">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="mt-2 text-sm leading-6 text-zinc-400">{{ subtitle() }}</p>
          }
        </header>
      }

      <ng-content />
    </section>
  `
})
export class PanelCardComponent {
  readonly title = input('');
  readonly subtitle = input('');
  readonly className = input('');
}
