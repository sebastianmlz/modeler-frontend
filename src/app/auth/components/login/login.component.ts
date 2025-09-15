import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        // Redirección ya se maneja en el servicio
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed';
      }
    });
  }
}
