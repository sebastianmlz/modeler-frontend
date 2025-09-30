import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP interceptor to add authorization headers to API requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access');
  
  // Skip authorization for external APIs (e.g., Gemini)
  if (req.url.startsWith('https://generativelanguage.googleapis.com')) {
    return next(req);
  }
  
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};