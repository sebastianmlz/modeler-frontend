import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {
  goToDiagramList(): void {
    if (this.project?.id) {
      // Pasar los datos de los diagramas que ya tenemos para evitar problemas de permisos
      this.router.navigate(['/diagram/list'], { 
        queryParams: { project: this.project.id },
        state: {
          diagrams: this.diagrams,
          projectData: this.project,
          fromProjectDetail: true
        }
      });
    } else {
      this.router.navigate(['/diagram/list']);
    }
  }
  project: any = null;
  loading: boolean = true;
  error: string = '';
  diagrams: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    // Verificar si tenemos datos del proyecto desde el dashboard
    const navigationState = this.router.getCurrentNavigation()?.extras?.state || 
                           (history.state?.projectData ? history.state : null);
    
    if (navigationState && navigationState.projectData && navigationState.fromDashboard) {
      // Usar los datos que vienen del dashboard
      console.log('[ProjectDetail] Usando datos del dashboard:', navigationState.projectData);
      this.project = navigationState.projectData.project;
      this.diagrams = navigationState.projectData.diagrams || [];
      this.loading = false;
    } else if (id) {
      // Fallback: intentar cargar desde la API (para usuarios creadores)
      console.log('[ProjectDetail] Cargando desde API...');
      this.projectService.getProject(id).subscribe({
        next: (proj) => {
          this.project = proj;
          // TODO: Reemplazar por llamada real a diagramas del proyecto
          this.diagrams = [
            { id: 'd1', name: 'Diagrama demo 1', created_at: '2025-09-14T15:00:00Z' },
            { id: 'd2', name: 'Diagrama demo 2', created_at: '2025-09-13T12:30:00Z' }
          ];
          this.loading = false;
        },
        error: (err) => {
          console.error('[ProjectDetail] Error al cargar proyecto:', err);
          this.error = 'No se pudo cargar el proyecto. Es posible que no tengas permisos suficientes.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID de proyecto no válido.';
      this.loading = false;
    }
  }

  goToDiagramShow(diagramId: string): void {
    this.router.navigate(['/diagram/show', diagramId]);
  }

  goBack(): void {
    this.router.navigate(['/project'], { queryParams: { organization: this.project?.organization } });
  }
}
