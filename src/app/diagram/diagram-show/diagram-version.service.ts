
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DiagramVersionService {
	private apiUrl = environment.apiUrl;

		constructor(private http: HttpClient) {}

		// Guardar una nueva versión
		createVersion(diagramId: string, snapshot: any, message: string): Observable<any> {
			return this.http.post(`${this.apiUrl}/api/diagram-versions/`, {
				diagram_id: diagramId,
				snapshot,
				message
			});
		}

		// Listar versiones de un diagrama
		listVersions(diagramId: string, ordering?: string, page?: number): Observable<any> {
			let params: any = { diagram: diagramId };
			if (ordering) params.ordering = ordering;
			if (page) params.page = page;
			return this.http.get(`${this.apiUrl}/api/diagram-versions/`, { params });
		}

		// Obtener una versión específica
		getVersion(versionId: string): Observable<any> {
			return this.http.get(`${this.apiUrl}/api/diagram-versions/${versionId}/`);
		}
}
