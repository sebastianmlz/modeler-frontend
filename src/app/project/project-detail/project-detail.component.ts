import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';
import { DiagramService } from '../../diagram/diagram.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {
  // Data properties
  project: any = null;
  diagrams: any[] = [];
  
  // UI state properties
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private diagramService: DiagramService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'ID de proyecto no válido.';
      this.loading = false;
      return;
    }
    
    this.loadProjectData(id);
  }

  /**
   * Navigate to diagram list for this project
   */
  goToDiagramList(): void {
    const projectId = this.project?.id;
    const navigation = projectId 
      ? ['/diagram/list']
      : ['/diagram/list'];
    const queryParams = projectId 
      ? { queryParams: { project: projectId } }
      : {};
    
    this.router.navigate(navigation, queryParams);
  }

  /**
   * Navigate to diagram show page
   */
  goToDiagramShow(diagramId: string): void {
    this.router.navigate(['/diagram/show', diagramId]);
  }

  /**
   * Navigate back to project list
   */
  goBack(): void {
    this.router.navigate(['/project'], {
      queryParams: { organization: this.project?.organization }
    });
  }

  /**
   * Load project data from navigation state or API
   */
  private loadProjectData(id: string): void {
    const navigationState = this.getNavigationState();
    
    if (this.hasValidNavigationState(navigationState)) {
      this.loadFromNavigationState(navigationState);
    } else {
      this.loadFromAPI(id);
    }
  }

  /**
   * Get navigation state from router or history
   */
  private getNavigationState(): any {
    return this.router.getCurrentNavigation()?.extras?.state || 
           (history.state?.projectData ? history.state : null);
  }

  /**
   * Check if navigation state has valid project data
   */
  private hasValidNavigationState(state: any): boolean {
    return state && state.projectData && state.fromDashboard;
  }

  /**
   * Load project data from navigation state
   */
  private loadFromNavigationState(state: any): void {
    this.project = state.projectData.project;
    this.diagrams = state.projectData.diagrams || [];
    this.loading = false;
  }

  /**
   * Load project data from API
   */
  private loadFromAPI(id: string): void {
    this.projectService.getProject(id).subscribe({
      next: (proj) => {
        this.project = proj;
        this.loadDiagrams(proj.id);
      },
      error: () => {
        this.error = 'No se pudo cargar el proyecto. Es posible que no tengas permisos suficientes.';
        this.loading = false;
      }
    });
  }

  /**
   * Load diagrams for the project
   */
  private loadDiagrams(projectId: string): void {
    this.diagramService.getDiagrams(projectId).subscribe({
      next: (res) => {
        this.diagrams = res.results || [];
        this.loading = false;
      },
      error: () => {
        this.diagrams = [];
        this.loading = false;
      }
    });
  }
}
