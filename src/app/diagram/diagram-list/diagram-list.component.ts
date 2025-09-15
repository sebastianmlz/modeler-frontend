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
    if (this.projectId) {
      this.diagramService.getDiagrams(this.projectId).subscribe({
        next: (res) => {
          this.diagrams = res.results || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar diagramas.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'No se especificó proyecto.';
      this.loading = false;
    }
  }

  goToDetail(diagram: any): void {
    this.router.navigate(['/diagram', diagram.id]);
  }

  goToCreate(): void {
    if (this.projectId) {
      this.router.navigate(['/diagram/create'], { queryParams: { project: this.projectId } });
    } else {
      this.router.navigate(['/diagram/create']);
    }
  }
}
