
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrganizationService } from '../organization.service';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.css'
})
export class OrganizationListComponent implements OnInit {
  // Data properties
  organizations: any[] = [];
  
  // UI state properties
  loading: boolean = true;
  error: string = '';

  constructor(
    private organizationService: OrganizationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrganizations();
  }

  /**
   * Navigate to organization detail page
   */
  goToDetail(org: any): void {
    this.router.navigate(['/organization', org.id]);
  }

  /**
   * Navigate to create organization page
   */
  goToCreate(): void {
    this.router.navigate(['/organization/create']);
  }

  /**
   * Load organizations from API
   */
  private loadOrganizations(): void {
    this.organizationService.getOrganizations().subscribe({
      next: (res) => {
        this.organizations = res.results || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar organizaciones';
        this.loading = false;
      }
    });
  }
}
