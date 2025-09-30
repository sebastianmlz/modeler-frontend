import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationService } from '../organization.service';
import { ProjectService } from '../../project/project.service';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organization-detail.component.html',
  styleUrl: './organization-detail.component.css'
})
export class OrganizationDetailComponent implements OnInit {
  // Data properties
  organization: any = null;
  projects: any[] = [];
  
  // UI state properties
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private organizationService: OrganizationService,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'ID de organización no válido.';
      this.loading = false;
      return;
    }
    
    this.loadOrganization(id);
  }

  /**
   * Navigate back to organizations list
   */
  goBack(): void {
    this.router.navigate(['/organization']);
  }

  /**
   * Load organization details and its projects
   */
  private loadOrganization(id: string): void {
    this.organizationService.getOrganization(id).subscribe({
      next: (org) => {
        this.organization = org;
        this.loadProjects(org.id);
      },
      error: () => {
        this.error = 'No se pudo cargar la organización.';
        this.loading = false;
      }
    });
  }

  /**
   * Load projects for the organization
   */
  private loadProjects(organizationId: string): void {
    this.projectService.getProjects(organizationId).subscribe({
      next: (res) => {
        this.projects = res.results || [];
        this.loading = false;
      },
      error: () => {
        this.projects = [];
        this.loading = false;
      }
    });
  }

  /**
   * Navigate to project detail page
   */
  goToProjectDetail(project: any): void {
    this.router.navigate(['/project', project.id], {
      state: {
        projectData: {
          project: project,
          diagrams: []
        },
        fromDashboard: true
      }
    });
  }

  /**
   * Navigate to projects list for this organization
   */
  goToProjectList(): void {
    const organizationId = this.organization?.id;
    const navigation = organizationId 
      ? ['/project'] 
      : ['/project'];
    const queryParams = organizationId 
      ? { queryParams: { organization: organizationId } } 
      : {};
    
    this.router.navigate(navigation, queryParams);
  }
}
