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
  organizationId: string | null = null;
  name: string = '';
  key: string = '';
  is_private: boolean = false;
  loading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(private projectService: ProjectService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.organizationId = this.route.snapshot.queryParamMap.get('organization');
  }

  createProject() {
    this.error = '';
    this.success = false;
    if (!this.organizationId) {
      this.error = 'No se especificó organización.';
      return;
    }
    if (!this.name.trim() || !this.key.trim()) {
      this.error = 'Todos los campos son obligatorios.';
      return;
    }
    this.loading = true;
    this.projectService.createProject({
      organization: this.organizationId,
      name: this.name,
      key: this.key,
      is_private: this.is_private
    }).subscribe({
      next: (res) => {
        this.success = true;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/project'], { queryParams: { organization: this.organizationId } });
        }, 1200);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al crear proyecto.';
        this.loading = false;
      }
    });
  }
}
