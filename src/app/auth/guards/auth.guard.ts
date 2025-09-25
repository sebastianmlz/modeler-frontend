import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('access');
  if (token) {
    return true;
  } else {
    // Guardar la URL a la que el usuario quería acceder
    localStorage.setItem('redirectUrl', state.url);
    console.log('[AUTH] Guardando URL de redirección:', state.url);
    window.location.href = '/login';
    return false;
  }
};