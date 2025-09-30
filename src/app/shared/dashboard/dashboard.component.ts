import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MembersService } from '../../diagram/diagram-show/members.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Data properties
  myProjects: any[] = [];
  
  // UI state properties
  loading: boolean = true;
  error: string = '';

  constructor(
    private membersService: MembersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyProjects();
  }

  /**
   * Navigate to project detail page with cached data
   */
  goToProjectDetail(projectId: string): void {
    const projectData = this.myProjects.find(p => p.project.id === projectId);
    
    if (projectData) {
      this.router.navigate(['/project', projectId], { 
        state: { 
          projectData: projectData,
          fromDashboard: true 
        } 
      });
    } else {
      this.router.navigate(['/project', projectId]);
    }
  }

  /**
   * Navigate to diagram show page
   */
  goToDiagramShow(diagramId: string): void {
    this.router.navigate(['/diagram/show', diagramId]);
  }

  /**
   * Load user's projects from API
   */
  private loadMyProjects(): void {
    this.membersService.getMyProjects().subscribe({
      next: (response) => {
        this.myProjects = response.projects || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar proyectos donde eres miembro';
        this.loading = false;
      }
    });
  }
}
