import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/header/header.component';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, ButtonModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'modeler-frontend';

  constructor(private auth: AuthService) {}

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }
}
