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
  name: string = '';
  slug: string = '';
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(private organizationService: OrganizationService, private router: Router) {}

  createOrganization() {
    this.error = '';
    this.success = false;
    if (!this.name.trim() || !this.slug.trim()) {
      this.error = 'Todos los campos son obligatorios.';
      return;
    }
    this.loading = true;
    this.organizationService.createOrganization({ name: this.name, slug: this.slug }).subscribe({
      next: (res) => {
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
}
