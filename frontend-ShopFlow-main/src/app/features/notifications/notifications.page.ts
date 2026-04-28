import { CommonModule, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NotificationType } from '../../core/models/ui.models';
import { WorkspaceService } from '../../core/services/workspace.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';
import { SectionHeadingComponent } from '../../shared/components/section-heading/section-heading.component';

type NotificationTab = 'all' | NotificationType;

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, NgClass, EmptyStateComponent, IconComponent, PanelCardComponent, SectionHeadingComponent],
  template: `
    <div class="grid gap-7 xl:grid-cols-[1fr,390px]">
      <section class="space-y-6">
        <app-section-heading
          title="Notifications"
          subtitle="Stay updated with your orders, messages, and offers."
        />

        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
          <div class="flex flex-wrap gap-6">
            @for (tab of tabs; track tab.value) {
              <button
                type="button"
                class="relative pb-4 text-sm font-medium transition"
                [ngClass]="activeTab() === tab.value ? 'text-emerald-300' : 'text-zinc-400 hover:text-white'"
                (click)="activeTab.set(tab.value)"
              >
                {{ tab.label }}
                @if (tab.count()) {
                  <span class="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs text-white">{{ tab.count() }}</span>
                }
                @if (activeTab() === tab.value) {
                  <span class="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-400"></span>
                }
              </button>
            }
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
            (click)="workspace.markAllNotificationsRead()"
          >
            <app-icon name="circle-check" [size]="16" className="text-sky-300" />
            Mark all as read
          </button>
        </div>

        @if (filteredNotifications().length) {
          <div class="overflow-hidden rounded-md border border-white/10">
            @for (notification of filteredNotifications(); track notification.id) {
              <button
                type="button"
                class="grid w-full grid-cols-[56px,1fr,120px,92px] items-center gap-4 border-b border-white/10 bg-white/[0.035] px-5 py-4 text-left transition last:border-b-0 hover:bg-white/[0.055]"
                (click)="workspace.markNotificationRead(notification.id)"
              >
                <span
                  class="flex h-12 w-12 items-center justify-center rounded-full"
                  [ngClass]="accentClasses(notification.accent)"
                >
                  <app-icon [name]="iconFor(notification.type)" [size]="20" className="text-white" />
                </span>

                <span>
                  <span class="block font-semibold text-white">{{ notification.title }}</span>
                  <span class="mt-1 block text-sm text-zinc-400">{{ notification.body }}</span>
                </span>

                <span class="text-right text-sm text-zinc-400">{{ notification.createdAtLabel }}</span>

                <span class="flex items-center justify-end gap-3">
                  @if (notification.imageUrl) {
                    <img class="h-16 w-20 rounded-md object-cover opacity-70" [src]="notification.imageUrl" [alt]="notification.title" />
                  }
                  <span class="h-2 w-2 rounded-full" [ngClass]="notification.read ? 'bg-zinc-600' : 'bg-emerald-400'"></span>
                </span>
              </button>
            }
          </div>

          <div class="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span class="h-px w-10 bg-white/20"></span>
            You've reached the end
            <span class="h-px w-10 bg-white/20"></span>
          </div>
        } @else {
          <app-empty-state
            icon="bell"
            title="No notifications"
            message="Order and account updates will appear here."
          />
        }
      </section>

      <aside class="space-y-5">
        <app-panel-card title="Notification Preferences" subtitle="Choose what notifications you want to receive.">
          <div class="space-y-5">
            @for (preference of workspace.notificationPreferences(); track preference.key) {
              <label class="flex items-center justify-between gap-4">
                <span class="flex items-start gap-4">
                  <app-icon [name]="preference.icon" [size]="19" className="mt-1 text-zinc-200" />
                  <span>
                    <span class="block font-semibold text-white">{{ preference.label }}</span>
                    <span class="block text-sm text-zinc-400">{{ preference.description }}</span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  class="h-5 w-10 rounded-full accent-emerald-400"
                  [checked]="preference.enabled"
                  (change)="workspace.toggleNotificationPreference(preference.key)"
                />
              </label>
            }
          </div>
          <button type="button" class="button-secondary mt-6 w-full justify-center">Save Preferences</button>
        </app-panel-card>

        <app-panel-card title="Quick Actions">
          <div class="space-y-1">
            @for (action of quickActions; track action.label) {
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                (click)="action.run()"
              >
                <span class="inline-flex items-center gap-3">
                  <app-icon [name]="action.icon" [size]="18" className="text-zinc-200" />
                  {{ action.label }}
                </span>
                <app-icon name="chevron-right" [size]="16" className="text-zinc-500" />
              </button>
            }
          </div>
        </app-panel-card>
      </aside>
    </div>
  `
})
export class NotificationsPageComponent {
  readonly workspace = inject(WorkspaceService);
  readonly activeTab = signal<NotificationTab>('all');

  readonly tabs = [
    { label: 'All', value: 'all' as const, count: () => this.workspace.notifications().length },
    { label: 'Orders', value: 'order' as const, count: () => this.count('order') },
    { label: 'Messages', value: 'message' as const, count: () => this.count('message') },
    { label: 'Offers', value: 'offer' as const, count: () => this.count('offer') },
    { label: 'System', value: 'system' as const, count: () => 0 }
  ];

  readonly filteredNotifications = computed(() => {
    const tab = this.activeTab();
    return this.workspace.notifications().filter((item) => tab === 'all' || item.type === tab);
  });

  readonly quickActions = [
    { label: 'Mark all as read', icon: 'mail', run: () => this.workspace.markAllNotificationsRead() },
    { label: 'Notification history', icon: 'return', run: () => this.activeTab.set('all') },
    { label: 'Email notification settings', icon: 'mail', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }
  ];

  count(type: NotificationType): number {
    return this.workspace.notifications().filter((item) => item.type === type).length;
  }

  iconFor(type: NotificationType): string {
    switch (type) {
      case 'order':
        return 'shopping-cart';
      case 'message':
        return 'message';
      case 'offer':
        return 'tag';
      case 'wishlist':
        return 'heart';
      default:
        return 'shield-check';
    }
  }

  accentClasses(accent: string): string {
    switch (accent) {
      case 'green':
        return 'bg-emerald-500/35 text-emerald-100';
      case 'blue':
        return 'bg-sky-500/35 text-sky-100';
      case 'purple':
        return 'bg-purple-500/35 text-purple-100';
      case 'amber':
        return 'bg-amber-500/35 text-amber-100';
      case 'pink':
        return 'bg-rose-500/35 text-rose-100';
      default:
        return 'bg-zinc-700 text-zinc-100';
    }
  }
}
