import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DiagramService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Listar diagramas de un proyecto
   * @param projectId UUID del proyecto
   * @param page Número de página
   * @param search Término de búsqueda
   */
  getDiagrams(projectId: string, page: number = 1, search: string = ''): Observable<any> {
    const params: any = { project: projectId };
    if (page) params.page = page;
    if (search) params.search = search;
    return this.http.get(`${this.apiUrl}/api/diagrams/`, { params });
  }

  /**
   * Crear diagrama en un proyecto
   * @param data Datos del diagrama
   */
  createDiagram(data: { project: string; name: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/diagrams/`, data);
  }

  /**
   * Obtener detalle de un diagrama por ID
   * @param id UUID del diagrama
   */
  getDiagram(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/diagrams/${id}/`);
  }
}
