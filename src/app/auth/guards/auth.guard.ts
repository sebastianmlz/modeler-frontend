import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('access');
  if (token) {
    return true;
  } else {
    window.location.href = '/login';
    return false;
  }
};