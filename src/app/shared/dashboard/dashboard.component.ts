import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MembersService } from '../../diagram/diagram-show/members.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  myProjects: any[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(
    private membersService: MembersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyProjects();
  }

  loadMyProjects(): void {
    // Usar solo my-projects que ya contiene toda la información necesaria
    this.membersService.getMyProjects().subscribe({
      next: (response) => {
        this.myProjects = response.projects || [];
        this.loading = false;
        console.log('[Dashboard] Respuesta completa de my-projects:', response);
        console.log('[Dashboard] Proyectos array:', this.myProjects);
        
        // Debug para ver la estructura de cada proyecto
        this.myProjects.forEach((project, index) => {
          console.log(`[Dashboard] Proyecto ${index}:`, project);
          console.log(`[Dashboard] Diagramas count: ${project.diagrams_count}`);
          console.log(`[Dashboard] Diagramas array:`, project.diagrams);
        });
      },
      error: (err: unknown) => {
        console.error('[Dashboard] Error al cargar mis proyectos:', err);
        this.error = 'Error al cargar proyectos donde eres miembro';
        this.loading = false;
      }
    });
  }

  goToProjectDetail(projectId: string): void {
    // Buscar los datos del proyecto en nuestro array local
    const projectData = this.myProjects.find(p => p.project.id === projectId);
    if (projectData) {
      // Pasar los datos del proyecto como estado de navegación
      this.router.navigate(['/project', projectId], { 
        state: { 
          projectData: projectData,
          fromDashboard: true 
        } 
      });
    } else {
      // Fallback: navegación normal (para casos edge)
      this.router.navigate(['/project', projectId]);
    }
  }

  goToDiagramShow(diagramId: string): void {
    this.router.navigate(['/diagram/show', diagramId]);
  }
}
