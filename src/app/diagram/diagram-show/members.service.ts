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
}
