import { Component } from '@angular/core';
import { BoardComponent } from './board/board';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {}
