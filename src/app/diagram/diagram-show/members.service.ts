import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Service for managing diagram and project membership operations
 */
@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get members of a specific diagram
   * @param diagramId Diagram UUID
   */
  getDiagramMembers(diagramId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/diagrams/${diagramId}/members/`);
  }

  /**
   * Get diagrams where current user is a member
   */
  getMyDiagrams(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/my-diagrams/`);
  }

  /**
   * Get projects where current user is a member with detailed information
   */
  getMyProjects(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/my-projects/`);
  }
  
  /**
   * Join a project as a member
   * @param projectId Project UUID
   * @param role Role to assign to the user (defaults to 'MEMBER')
   */
  joinProject(projectId: string, role: string = 'MEMBER'): Observable<any> {
    
    const payload = {
      project: projectId,
      user: null, // Backend will use current authenticated user
      role: role
    };
    
    return this.http.post(`${this.apiUrl}/api/project-members/`, payload);
  }
  
  /**
   * Join a project by diagram ID (when project ID is not known)
   * @param targetId Either project UUID or diagram UUID 
   * @param type Either 'project' or 'diagram'
   * @param role Role to assign to the user (defaults to 'MEMBER')
   */
  joinProjectByDiagram(targetId: string, type: 'project' | 'diagram' = 'diagram', role: string = 'MEMBER'): Observable<any> {
    
    if (type === 'project') {
      // Si tenemos el projectId, usar el endpoint normal
      return this.joinProject(targetId, role);
    } else {
      // Intentar crear membresía usando diagramId
      // Esto puede funcionar si el backend acepta diagram_id como parámetro adicional
      const payload = {
        project: targetId, // Usar diagramId como project temporalmente
        user: null,
        role: role,
        diagram_id: targetId // Agregar diagramId por si el backend lo necesita
      };
      

      
      return this.http.post(`${this.apiUrl}/api/project-members/`, payload);
    }
  }
  
  /**
   * Get project information by diagram ID (DEPRECATED - endpoint doesn't exist)
   * @param diagramId Diagram UUID
   */
  getProjectByDiagram(diagramId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/diagrams/${diagramId}/project/`);
  }
  
  /**
   * Accept invitation to join project via diagram access
   * @param diagramId Diagram UUID
   */
  acceptDiagramInvitation(diagramId: string): Observable<any> {
    
    // Intentar diferentes endpoints que podrían existir para invitaciones
    return this.http.post(`${this.apiUrl}/api/diagrams/${diagramId}/join/`, {
      action: 'accept'
    });
  }
  
  /**
   * Try to join project using diagram collaboration endpoint
   * @param diagramId Diagram UUID
   */
  joinViaCollaboration(diagramId: string): Observable<any> {
    
    return this.http.post(`${this.apiUrl}/api/diagrams/${diagramId}/collaborate/`, {
      action: 'join'
    });
  }
}
