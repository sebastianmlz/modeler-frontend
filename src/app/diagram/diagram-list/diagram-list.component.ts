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
  // Route parameter
  projectId: string | null = null;
  
  // Data properties
  diagrams: any[] = [];
  
  // UI state properties
  loading: boolean = true;
  error: string = '';

  constructor(
    private diagramService: DiagramService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.queryParamMap.get('project');
    
    if (!this.projectId) {
      this.error = 'No se especificó proyecto.';
      this.loading = false;
      return;
    }
    
    this.loadDiagrams();
  }

  /**
   * Navigate to diagram detail page
   */
  goToDetail(diagram: any): void {
    this.router.navigate(['/diagram', diagram.id]);
  }

  /**
   * Navigate to diagram editor
   */
  goToEdit(diagram: any): void {
    this.router.navigate(['/diagram/show', diagram.id]);
  }

  /**
   * Navigate to create diagram page
   */
  goToCreate(): void {
    const navigation = ['/diagram/create'];
    const queryParams = this.projectId 
      ? { queryParams: { project: this.projectId } }
      : {};
    
    this.router.navigate(navigation, queryParams);
  }

  /**
   * Load diagrams from API
   */
  private loadDiagrams(): void {
    this.diagramService.getDiagrams(this.projectId!).subscribe({
      next: (res) => {
        this.diagrams = res.results || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar diagramas.';
        this.loading = false;
      }
    });
  }
}
