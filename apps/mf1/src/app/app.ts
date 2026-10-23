import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CartStore } from '@mfe/shared/data-access-cart';

@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'mf1-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly cart = inject(CartStore);
}
