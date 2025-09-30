import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent implements OnInit {
  // Route parameter
  organizationId: string | null = null;
  
  // Data properties
  projects: any[] = [];
  
  // UI state properties
  loading: boolean = true;
  error: string = '';

  constructor(
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.organizationId = this.route.snapshot.queryParamMap.get('organization');
    
    if (!this.organizationId) {
      this.error = 'No se especificó organización.';
      this.loading = false;
      return;
    }
    
    this.loadProjects();
  }

  /**
   * Navigate to project detail page
   */
  goToDetail(project: any): void {
    this.router.navigate(['/project', project.id]);
  }

  /**
   * Navigate to create project page
   */
  goToCreate(): void {
    const navigation = ['/project/create'];
    const queryParams = this.organizationId 
      ? { queryParams: { organization: this.organizationId } }
      : {};
    
    this.router.navigate(navigation, queryParams);
  }

  /**
   * Load projects from API
   */
  private loadProjects(): void {
    this.projectService.getProjects(this.organizationId!).subscribe({
      next: (res) => {
        this.projects = res.results || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar proyectos.';
        this.loading = false;
      }
    });
  }
}
