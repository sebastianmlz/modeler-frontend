import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrganizationService } from '../organization.service';

@Component({
  selector: 'app-organization-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-create.component.html',
  styleUrl: './organization-create.component.css'
})
export class OrganizationCreateComponent {
  // Form properties
  name: string = '';
  slug: string = '';
  
  // UI state properties
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(
    private organizationService: OrganizationService,
    private router: Router
  ) {}

  /**
   * Creates a new organization with form validation
   */
  createOrganization(): void {
    this.resetState();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.loading = true;
    const organizationData = { name: this.name, slug: this.slug };
    
    this.organizationService.createOrganization(organizationData).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/organization']);
        }, 1200);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al crear organización.';
        this.loading = false;
      }
    });
  }

  /**
   * Resets component state
   */
  private resetState(): void {
    this.error = '';
    this.success = false;
  }

  /**
   * Validates form fields
   */
  private validateForm(): boolean {
    if (!this.name.trim() || !this.slug.trim()) {
      this.error = 'Todos los campos son obligatorios.';
      return false;
    }
    return true;
  }
}
