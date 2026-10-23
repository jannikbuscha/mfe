import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Only used when MF2 runs standalone; the shell never loads this component. */
@Component({
  imports: [RouterOutlet],
  selector: 'mf2-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
