import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MembersService {
	private apiUrl = environment.apiUrl;

	constructor(private http: HttpClient) {}

	// Obtener miembros de un diagrama
	getDiagramMembers(diagramId: string): Observable<any> {
		return this.http.get(`${this.apiUrl}/api/diagrams/${diagramId}/members/`);
	}

	// Obtener diagramas donde el usuario es miembro
	getMyDiagrams(): Observable<any> {
		return this.http.get(`${this.apiUrl}/api/my-diagrams/`);
	}

	// Obtener proyectos donde el usuario es miembro (con más información del proyecto)
	getMyProjects(): Observable<any> {
		return this.http.get(`${this.apiUrl}/api/my-projects/`);
	}
}
