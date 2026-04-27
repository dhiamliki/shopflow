import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PanelCardComponent } from '../../shared/components/panel-card/panel-card.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, PanelCardComponent, EmptyStateComponent],
  template: `
    <app-panel-card title="Notifications">
      <app-empty-state
        icon="bell"
        title="No notifications yet"
        message="Updates about your orders, account, and promotions will appear here."
      />
    </app-panel-card>
  `
})
export class NotificationsPageComponent {}
