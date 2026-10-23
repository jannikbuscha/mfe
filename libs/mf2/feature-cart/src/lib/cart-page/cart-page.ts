import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Panel } from '@mfe/shared/ui';
import { CartView } from '../cart-view/cart-view';

@Component({
  selector: 'mf2-cart-page',
  imports: [CartView, Panel, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
  host: { 'data-testid': 'cart-page' },
})
export class CartPage {}
