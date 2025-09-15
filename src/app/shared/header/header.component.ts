import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule, ButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  user: any;
  menuItems: any[];

  constructor(public auth: AuthService, private router: Router) {
    this.user = this.auth.getUser();
    this.menuItems = [
      { label: 'Ajustes', icon: 'pi pi-cog', command: () => this.router.navigate(['/settings']) },
      { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.auth.logout() }
    ];
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
