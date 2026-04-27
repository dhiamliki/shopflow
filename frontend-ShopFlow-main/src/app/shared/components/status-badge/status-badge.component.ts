import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
      [ngClass]="classes()"
    >
      {{ label() }}
    </span>
  `
})
export class StatusBadgeComponent {
  readonly status = input<string>('');

  readonly label = computed(() => this.status().replaceAll('_', ' '));

  readonly classes = computed(() => {
    switch (this.status().toUpperCase()) {
      case 'DELIVERED':
        return 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300';
      case 'SHIPPED':
        return 'border-sky-400/20 bg-sky-500/15 text-sky-300';
      case 'PROCESSING':
      case 'PAID':
        return 'border-amber-400/20 bg-amber-500/15 text-amber-300';
      case 'CANCELLED':
        return 'border-rose-400/20 bg-rose-500/15 text-rose-300';
      default:
        return 'border-white/10 bg-white/5 text-zinc-300';
    }
  });
}
