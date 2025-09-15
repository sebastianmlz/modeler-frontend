import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar proyectos de una organización
   * @param organizationId UUID de la organización
   * @param page Número de página
   * @param search Término de búsqueda
   */
  getProjects(organizationId: string, page: number = 1, search: string = ''): Observable<any> {
    const params: any = { organization: organizationId };
    if (page) params.page = page;
    if (search) params.search = search;
    return this.http.get(`${this.apiUrl}/api/projects/`, { params });
  }

  /**
   * Crear proyecto en una organización
   * @param data Datos del proyecto
   */
  createProject(data: { organization: string; name: string; key: string; is_private: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/projects/`, data);
  }

  /**
   * Obtener detalle de un proyecto por ID
   * @param id UUID del proyecto
   */
  getProject(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/projects/${id}/`);
  }
}
