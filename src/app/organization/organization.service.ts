import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOrganizations(page: number = 1, search: string = ''): Observable<any> {
    const params: any = {};
    if (page) params.page = page;
    if (search) params.search = search;
    return this.http.get(`${this.apiUrl}/api/organizations/`, { params });
  }

  getOrganization(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/organizations/${id}/`);
  }

  createOrganization(data: { name: string; slug: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/organizations/`, data);
  }
}
