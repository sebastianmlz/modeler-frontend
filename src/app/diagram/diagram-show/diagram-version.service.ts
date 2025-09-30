
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Service for managing diagram version operations
 */
@Injectable({ providedIn: 'root' })
export class DiagramVersionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Create a new version of a diagram
   * @param diagramId Diagram UUID
   * @param snapshot Diagram snapshot data
   * @param message Version description message
   */
  createVersion(diagramId: string, snapshot: any, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/diagram-versions/`, {
      diagram_id: diagramId,
      snapshot,
      message
    });
  }

  /**
   * Get paginated list of diagram versions
   * @param diagramId Diagram UUID
   * @param ordering Sort order parameter
   * @param page Page number for pagination
   */
  listVersions(diagramId: string, ordering?: string, page?: number): Observable<any> {
    const params: any = { diagram: diagramId };
    if (ordering) params.ordering = ordering;
    if (page) params.page = page;
    return this.http.get(`${this.apiUrl}/api/diagram-versions/`, { params });
  }

  /**
   * Get specific version details
   * @param versionId Version UUID
   */
  getVersion(versionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/diagram-versions/${versionId}/`);
  }
}
