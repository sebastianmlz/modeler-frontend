import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuModule, ButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  // User data
  user: any;
  
  // Menu configuration
  menuItems: any[] = [];

  constructor(
    public auth: AuthService,
    private router: Router
  ) {
    this.user = this.auth.getUser();
    this.initializeMenu();
  }

  /**
   * Navigate to dashboard
   */
  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Initialize user menu items
   */
  private initializeMenu(): void {
    this.menuItems = [
      { 
        label: 'Ajustes', 
        icon: 'pi pi-cog', 
        command: () => this.router.navigate(['/settings']) 
      },
      { 
        label: 'Cerrar sesión', 
        icon: 'pi pi-sign-out', 
        command: () => this.auth.logout() 
      }
    ];
  }
}
