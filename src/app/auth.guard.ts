import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const user = localStorage.getItem('currentUser');

  if (user) {
    return true; // Let them through to the board
  } else {
    router.navigate(['/login']); // Kick them back to login
    return false;
  }
};