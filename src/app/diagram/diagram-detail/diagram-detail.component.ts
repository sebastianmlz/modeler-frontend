import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramService } from '../diagram.service';
import { DiagramVersionService } from '../diagram-show/diagram-version.service';

@Component({
  selector: 'app-diagram-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagram-detail.component.html',
  styleUrl: './diagram-detail.component.css'
})
export class DiagramDetailComponent implements OnInit {
  // Data properties
  diagram: any = null;
  versions: any[] = [];
  
  // UI state properties
  loading: boolean = true;
  error: string = '';
  loadingVersions: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private diagramService: DiagramService,
    private versionService: DiagramVersionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'ID de diagrama no válido.';
      this.loading = false;
      return;
    }
    
    this.loadDiagram(id);
  }

  /**
   * Load diagram details and its versions
   */
  private loadDiagram(id: string): void {
    this.diagramService.getDiagram(id).subscribe({
      next: (dia) => {
        this.diagram = dia;
        this.loading = false;
        this.loadVersions(dia.id);
      },
      error: () => {
        this.error = 'No se pudo cargar el diagrama.';
        this.loading = false;
      }
    });
  }

  /**
   * Load diagram versions
   */
  private loadVersions(diagramId: string): void {
    this.loadingVersions = true;
    this.versionService.listVersions(diagramId).subscribe({
      next: (res) => {
        this.versions = res.results || [];
        this.loadingVersions = false;
      },
      error: () => {
        this.loadingVersions = false;
      }
    });
  }

  /**
   * Open specific diagram version
   */
  openVersion(versionId: string): void {
    if (this.diagram?.id) {
      this.router.navigate(['/diagram/show', this.diagram.id], {
        queryParams: { versionId }
      });
    }
  }

  /**
   * Navigate back to diagram list
   */
  goBack(): void {
    this.router.navigate(['/diagram/list'], {
      queryParams: { project: this.diagram?.project }
    });
  }

  /**
   * Navigate to diagram editor
   */
  goToEdit(): void {
    if (this.diagram?.id) {
      this.router.navigate(['/diagram/show', this.diagram.id]);
    }
  }
}
