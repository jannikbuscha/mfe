import { DatePipe, JsonPipe } from '@angular/common';
import { Component, input } from '@angular/core';

export interface EventLogEntry {
  type: string;
  timestamp: number;
  data: unknown;
}

/** Renders registry events in the order given (callers sort them). */
@Component({
  selector: 'ui-event-log',
  imports: [DatePipe, JsonPipe],
  templateUrl: './event-log.html',
  styleUrl: './event-log.scss',
})
export class EventLog {
  readonly entries = input.required<readonly EventLogEntry[]>();
  readonly emptyText = input('Noch keine Events.');
}
