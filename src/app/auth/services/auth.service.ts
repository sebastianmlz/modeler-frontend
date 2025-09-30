import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Service for handling user authentication operations
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Authenticates user and handles post-login navigation
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/token/`, { username, password }).pipe(
      tap((res: any) => {
        this.storeTokens(res);
        this.loadUserProfile();
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

  /**
   * Registers a new user account
   */
  register(registerData: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register/register/`, registerData);
  }

  /**
   * Stores authentication tokens in localStorage
   */
  private storeTokens(tokenResponse: any): void {
    localStorage.setItem('access', tokenResponse.access);
    localStorage.setItem('refresh', tokenResponse.refresh);
  }

  /**
   * Loads user profile and handles post-login navigation
   */
  private loadUserProfile(): void {
    this.getProfile().subscribe(profile => {
      localStorage.setItem('user', JSON.stringify(profile));
      this.handlePostLoginNavigation();
    });
  }

  /**
   * Handles navigation after successful login
   */
  private handlePostLoginNavigation(): void {
    const redirectUrl = localStorage.getItem('redirectUrl');
    if (redirectUrl) {
      localStorage.removeItem('redirectUrl');
      this.router.navigateByUrl(redirectUrl);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
