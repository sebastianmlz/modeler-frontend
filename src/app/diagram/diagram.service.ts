import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Service for managing diagram operations
 */
@Injectable({ providedIn: 'root' })
export class DiagramService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of diagrams for a project
   * @param projectId Project UUID
   * @param page Page number for pagination
   * @param search Search term for filtering
   */
  getDiagrams(projectId: string, page: number = 1, search: string = ''): Observable<any> {
    const params: any = { project: projectId };
    if (page) params.page = page;
    if (search) params.search = search;
    return this.http.get(`${this.apiUrl}/api/diagrams/`, { params });
  }

  /**
   * Create a new diagram in a project
   * @param data Diagram creation data
   */
  createDiagram(data: { project: string; name: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/diagrams/`, data);
  }

  /**
   * Get diagram details by ID
   * @param id Diagram UUID
   */
  getDiagram(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/diagrams/${id}/`);
  }
}
