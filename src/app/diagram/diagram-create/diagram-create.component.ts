import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramService } from '../diagram.service';

@Component({
  selector: 'app-diagram-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagram-create.component.html',
  styleUrl: './diagram-create.component.css'
})
export class DiagramCreateComponent implements OnInit {
  projectId: string | null = null;
  name: string = '';
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(private diagramService: DiagramService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.queryParamMap.get('project');
  }

  createDiagram() {
    this.error = '';
    this.success = false;
    if (!this.projectId) {
      this.error = 'No se especificó proyecto.';
      return;
    }
    if (!this.name.trim()) {
      this.error = 'El nombre es obligatorio.';
      return;
    }
    this.loading = true;
    this.diagramService.createDiagram({
      project: this.projectId,
      name: this.name
    }).subscribe({
      next: (res) => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/diagram/list'], { queryParams: { project: this.projectId } });
        }, 1200);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al crear diagrama.';
        this.loading = false;
      }
    });
  }
}
