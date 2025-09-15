import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css'
})
export class ProjectListComponent implements OnInit {
  projects: any[] = [];
  loading: boolean = true;
  error: string = '';
  organizationId: string | null = null;

  constructor(private projectService: ProjectService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.organizationId = this.route.snapshot.queryParamMap.get('organization');
    if (this.organizationId) {
      this.projectService.getProjects(this.organizationId).subscribe({
        next: (res) => {
          this.projects = res.results || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar proyectos.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'No se especificó organización.';
      this.loading = false;
    }
  }

  goToDetail(project: any): void {
    this.router.navigate(['/project', project.id]);
  }

  goToCreate(): void {
    if (this.organizationId) {
      this.router.navigate(['/project/create'], { queryParams: { organization: this.organizationId } });
    } else {
      this.router.navigate(['/project/create']);
    }
  }
}
