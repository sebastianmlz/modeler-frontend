import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  // Form properties
  username: string = '';
  password: string = '';
  
  // UI state properties
  loading: boolean = false;
  error: string = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  /**
   * Handles login form submission
   */
  onSubmit(): void {
    this.loading = true;
    this.error = '';
    
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Error de inicio de sesión';
      }
    });
  }

  /**
   * Navigate to register page
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
