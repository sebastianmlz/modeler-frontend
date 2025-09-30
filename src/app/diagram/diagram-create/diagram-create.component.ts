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
  // Route parameter
  projectId: string | null = null;
  
  // Form properties
  name: string = '';
  
  // UI state properties
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(
    private diagramService: DiagramService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.queryParamMap.get('project');
  }

  /**
   * Creates a new diagram with form validation
   */
  createDiagram(): void {
    this.resetState();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.loading = true;
    const diagramData = {
      project: this.projectId!,
      name: this.name
    };
    
    this.diagramService.createDiagram(diagramData).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.navigateToDiagramList();
        }, 1200);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al crear diagrama.';
        this.loading = false;
      }
    });
  }

  /**
   * Resets component state
   */
  private resetState(): void {
    this.error = '';
    this.success = false;
  }

  /**
   * Validates form fields
   */
  private validateForm(): boolean {
    if (!this.projectId) {
      this.error = 'No se especificó proyecto.';
      return false;
    }
    
    if (!this.name.trim()) {
      this.error = 'El nombre es obligatorio.';
      return false;
    }
    
    return true;
  }

  /**
   * Navigate back to diagram list
   */
  private navigateToDiagramList(): void {
    this.router.navigate(['/diagram/list'], {
      queryParams: { project: this.projectId }
    });
  }
}
