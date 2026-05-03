import { Pipe, PipeTransform } from '@angular/core';
import { formatTndCurrency } from '../utils/currency';

@Pipe({
  name: 'tndCurrency',
  standalone: true
})
export class TndCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatTndCurrency(value);
  }
}
