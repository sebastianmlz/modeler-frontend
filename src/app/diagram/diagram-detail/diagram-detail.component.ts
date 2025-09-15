import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramService } from '../diagram.service';
import { DiagramVersionService } from '../diagram-show/diagram-version.service';
import { dia } from '@joint/core';

@Component({
  selector: 'app-diagram-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagram-detail.component.html',
  styleUrl: './diagram-detail.component.css'
})
export class DiagramDetailComponent implements OnInit {
  diagram: any = null;
  loading: boolean = true;
  error: string = '';
  versions: any[] = [];
  loadingVersions: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private diagramService: DiagramService,
    private versionService: DiagramVersionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.diagramService.getDiagram(id).subscribe({
        next: (dia) => {
          this.diagram = dia;
          this.loading = false;
          // Cargar versiones
          this.loadVersions(dia.id);
        },
        error: (err) => {
          this.error = 'No se pudo cargar el diagrama.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID de diagrama no válido.';
      this.loading = false;
    }
  }

  loadVersions(diagramId: string): void {
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

  openVersion(versionId: string): void {
    if (this.diagram?.id) {
      this.router.navigate(['/diagram/show', this.diagram.id], { queryParams: { versionId } });
    }
  }

  goBack(): void {
    this.router.navigate(['/diagram/list'], { queryParams: { project: this.diagram?.project } });
  }

  goToEdit(): void {
    if (this.diagram?.id) {
      this.router.navigate(['/diagram/show', this.diagram.id]);
    }
  }
}
