import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access');
  console.log('[AuthInterceptor] URL:', req.url);
  console.log('[AuthInterceptor] Token encontrado:', token ? 'SÍ' : 'NO');
  // No agregar Authorization si es Gemini API
  if (req.url.startsWith('https://generativelanguage.googleapis.com')) {
    console.log('[AuthInterceptor] 🚫 No se agrega Authorization para Gemini API');
    return next(req);
  }
  if (token) {
    console.log('[AuthInterceptor] Agregando header Authorization');
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  console.log('[AuthInterceptor] ⚠️ Petición sin token de autenticación');
  return next(req);
};