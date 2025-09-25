import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/token/`, { username, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('access', res.access);
        localStorage.setItem('refresh', res.refresh);
        this.getProfile().subscribe(profile => {
          localStorage.setItem('user', JSON.stringify(profile));
          
          // Verificar si hay una URL de redirección guardada
          const redirectUrl = localStorage.getItem('redirectUrl');
          if (redirectUrl) {
            console.log('[AUTH] Redirigiendo a URL guardada:', redirectUrl);
            localStorage.removeItem('redirectUrl'); // Limpiar la URL guardada
            this.router.navigateByUrl(redirectUrl);
          } else {
            console.log('[AUTH] No hay URL de redirección, yendo al dashboard');
            this.router.navigate(['/dashboard']);
          }
        });
      })
    );
  }

  getProfile(): Observable<any> {
    const token = this.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/api/auth/profiles/me/`, { headers });
  }

  logout(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
