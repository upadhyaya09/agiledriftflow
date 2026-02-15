import { Routes } from '@angular/router';
import { BoardComponent } from './board/board'; // Ensure NO .ts extension here

export const routes: Routes = [
  { path: '', component: BoardComponent } // Add this line
];