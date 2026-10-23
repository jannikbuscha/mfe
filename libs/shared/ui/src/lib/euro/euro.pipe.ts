import { Pipe, PipeTransform } from '@angular/core';

const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * Formats a price as `2,40 €`. Uses `Intl` instead of Angular's
 * `CurrencyPipe`, so remotes do not depend on locale data being registered
 * by whichever application hosts them.
 */
@Pipe({ name: 'euro' })
export class EuroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null ? '' : formatter.format(value);
  }
}
