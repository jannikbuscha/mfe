import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartStore } from '@mfe/shared/data-access-cart';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'shell-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // The shell is a registry consumer as well: the badge follows `cart.items`.
  protected readonly cart = inject(CartStore);
}
