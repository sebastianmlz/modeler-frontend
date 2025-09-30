import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-create.component.html',
  styleUrl: './project-create.component.css'
})
export class ProjectCreateComponent implements OnInit {
  // Route parameter
  organizationId: string | null = null;
  
  // Form properties
  name: string = '';
  key: string = '';
  is_private: boolean = false;
  
  // UI state properties
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.organizationId = this.route.snapshot.queryParamMap.get('organization');
  }

  /**
   * Creates a new project with form validation
   */
  createProject(): void {
    this.resetState();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.loading = true;
    const projectData = {
      organization: this.organizationId!,
      name: this.name,
      key: this.key,
      is_private: this.is_private
    };
    
    this.projectService.createProject(projectData).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.navigateToProjectList();
        }, 1200);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al crear proyecto.';
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
    if (!this.organizationId) {
      this.error = 'No se especificó organización.';
      return false;
    }
    
    if (!this.name.trim() || !this.key.trim()) {
      this.error = 'Todos los campos son obligatorios.';
      return false;
    }
    
    return true;
  }

  /**
   * Navigate back to project list
   */
  private navigateToProjectList(): void {
    this.router.navigate(['/project'], {
      queryParams: { organization: this.organizationId }
    });
  }
}
