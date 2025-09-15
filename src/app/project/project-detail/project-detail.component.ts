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
      this.router.navigate(['/diagram/list'], { queryParams: { project: this.project.id } });
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
    if (id) {
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
          this.error = 'No se pudo cargar el proyecto.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID de proyecto no válido.';
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/project'], { queryParams: { organization: this.project?.organization } });
  }
}
