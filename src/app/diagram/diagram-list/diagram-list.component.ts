import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramService } from '../diagram.service';

@Component({
  selector: 'app-diagram-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagram-list.component.html',
  styleUrl: './diagram-list.component.css'
})
export class DiagramListComponent implements OnInit {
  diagrams: any[] = [];
  loading: boolean = true;
  error: string = '';
  projectId: string | null = null;

  constructor(private diagramService: DiagramService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.queryParamMap.get('project');
    
    // Verificar si tenemos datos de diagramas desde project-detail
    const navigationState = this.router.getCurrentNavigation()?.extras?.state || 
                           (history.state?.diagrams ? history.state : null);
    
    if (navigationState && navigationState.diagrams && navigationState.fromProjectDetail) {
      // Usar los datos que vienen del project-detail
      console.log('[DiagramList] Usando datos del project-detail:', navigationState.diagrams);
      this.diagrams = navigationState.diagrams || [];
      this.loading = false;
    } else if (this.projectId) {
      // Fallback: intentar cargar desde la API (para usuarios creadores)
      console.log('[DiagramList] Cargando desde API...');
      this.diagramService.getDiagrams(this.projectId).subscribe({
        next: (res) => {
          this.diagrams = res.results || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('[DiagramList] Error al cargar diagramas:', err);
          this.error = 'Error al cargar diagramas. Es posible que no tengas permisos suficientes.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'No se especificó proyecto.';
      this.loading = false;
    }
  }

  goToDetail(diagram: any): void {
    // Navegar directamente al editor de diagramas
    this.router.navigate(['/diagram/show', diagram.id]);
  }

  goToCreate(): void {
    if (this.projectId) {
      this.router.navigate(['/diagram/create'], { queryParams: { project: this.projectId } });
    } else {
      this.router.navigate(['/diagram/create']);
    }
  }
}
