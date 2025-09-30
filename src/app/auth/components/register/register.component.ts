import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  // Form properties
  username: string = '';
  email: string = '';
  first_name: string = '';
  last_name: string = '';
  password: string = '';
  password_confirm: string = '';
  display_name: string = '';
  
  // UI state properties
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  /**
   * Handles registration form submission with validation
   */
  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.success = false;

    if (!this.validateForm()) {
      this.loading = false;
      return;
    }

    const registerData = {
      username: this.username,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      password: this.password,
      password_confirm: this.password_confirm,
      display_name: this.display_name || `${this.first_name} ${this.last_name}`
    };

    this.auth.register(registerData).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = this.getErrorMessage(err);
      }
    });
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Validates registration form fields
   */
  private validateForm(): boolean {
    if (!this.username.trim() || !this.email.trim() || !this.first_name.trim() || 
        !this.last_name.trim() || !this.password.trim() || !this.password_confirm.trim()) {
      this.error = 'Todos los campos son obligatorios';
      return false;
    }

    if (this.password !== this.password_confirm) {
      this.error = 'Las contraseñas no coinciden';
      return false;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    return true;
  }

  /**
   * Extracts appropriate error message from API response
   */
  private getErrorMessage(err: any): string {
    if (err?.error?.username) {
      return 'El nombre de usuario ya está en uso';
    } else if (err?.error?.email) {
      return 'El correo electrónico ya está registrado';
    } else if (err?.error?.password) {
      return 'La contraseña no cumple con los requisitos';
    } else {
      return err?.error?.message || 'Error al registrar usuario. Inténtalo de nuevo.';
    }
  }
}
