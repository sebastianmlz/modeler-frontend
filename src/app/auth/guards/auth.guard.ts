import { CanActivateFn } from '@angular/router';

/**
 * Authentication guard to protect routes requiring user authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('access');
  
  if (token) {
    return true;
  }
  
  // Store the intended URL for post-login redirect
  localStorage.setItem('redirectUrl', state.url);
  window.location.href = '/login';
  return false;
};