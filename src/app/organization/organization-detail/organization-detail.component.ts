import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationService } from '../organization.service';

@Component({
  selector: 'app-organization-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organization-detail.component.html',
  styleUrl: './organization-detail.component.css'
})
export class OrganizationDetailComponent implements OnInit {
  organization: any = null;
  loading: boolean = true;
  error: string = '';
  projects: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private organizationService: OrganizationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.organizationService.getOrganization(id).subscribe({
        next: (org) => {
          this.organization = org;
          // TODO: Reemplazar por llamada real a proyectos de la organización
          this.projects = [
            { id: 'p1', name: 'Proyecto demo 1', created_at: '2025-09-14T15:00:00Z' },
            { id: 'p2', name: 'Proyecto demo 2', created_at: '2025-09-13T12:30:00Z' }
          ];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'No se pudo cargar la organización.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID de organización no válido.';
      this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/organization']);
  }

  goToProjectDetail(project: any): void {
    this.router.navigate(['/project', project.id]);
  }

  goToProjectList(): void {
    if (this.organization?.id) {
      this.router.navigate(['/project'], { queryParams: { organization: this.organization.id } });
    } else {
      this.router.navigate(['/project']);
    }
  }
}
