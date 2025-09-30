import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Service for managing organization operations
 */
@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of organizations with optional search
   */
  getOrganizations(page: number = 1, search: string = ''): Observable<any> {
    const params: any = {};
    if (page) params.page = page;
    if (search) params.search = search;
    return this.http.get(`${this.apiUrl}/api/organizations/`, { params });
  }

  /**
   * Get organization details by ID
   */
  getOrganization(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/organizations/${id}/`);
  }

  /**
   * Create a new organization
   */
  createOrganization(data: { name: string; slug: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/organizations/`, data);
  }
}
