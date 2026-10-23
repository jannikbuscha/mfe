import { TestBed } from '@angular/core/testing';
import { EventLog } from './event-log';

describe('EventLog', () => {
  it('shows the empty text without entries', async () => {
    const fixture = TestBed.createComponent(EventLog);
    fixture.componentRef.setInput('entries', []);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Noch keine Events.');
  });

  it('renders one row per entry with type and payload', async () => {
    const fixture = TestBed.createComponent(EventLog);
    fixture.componentRef.setInput('entries', [
      { type: 'cart.items', timestamp: 0, data: [{ productId: 'p1' }] },
      { type: 'cart.checked-out', timestamp: 1, data: { orderId: 'o1' } },
    ]);
    await fixture.whenStable();
    const rows = fixture.nativeElement.querySelectorAll(
      '[data-testid="event-log-entry"]',
    ) as NodeListOf<HTMLElement>;

    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('cart.items');
    expect(rows[1].textContent).toContain('"orderId": "o1"');
  });
});
