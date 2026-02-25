import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth'; 
import { BoardComponent } from './board/board'; // Import your board component
import { authGuard } from './auth.guard'; // Import the guard

export const routes: Routes = [
  // 1. Home page shows Login/Register
  { path: '', component: AuthComponent }, 
  
  // 2. The destination after successful login
  { 
    path: 'board', 
    component: BoardComponent, 
    canActivate: [authGuard] // The guard protects this route
  },
  
  // 3. Wildcard: Redirect any unknown URLs (like /xyz) back to Login
  { path: '**', redirectTo: '' } 
];