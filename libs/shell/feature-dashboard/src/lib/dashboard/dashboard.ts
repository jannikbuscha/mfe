import { Component } from '@angular/core';
import { Panel } from '@mfe/shared/ui';
import { EventMonitor } from '../event-monitor/event-monitor';
import { RemoteWidget } from '../remote-widget/remote-widget';

/**
 * Both micro frontends side by side. They do not know each other; everything
 * that connects them goes through the event registry (see the monitor).
 */
@Component({
  selector: 'shell-dashboard',
  imports: [EventMonitor, Panel, RemoteWidget],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
