import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { DiagramCollabEvent } from '../../diagram-collab-event.model';

@Injectable({ providedIn: 'root' })
export class DiagramCollaborationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private eventsSubject = new Subject<DiagramCollabEvent>();
  private statusSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');

  events$: Observable<DiagramCollabEvent> = this.eventsSubject.asObservable();
  status$: Observable<'disconnected' | 'connecting' | 'connected'> = this.statusSubject.asObservable();

  connect(diagramId: string, token?: string) {
    if (this.socket) {
      this.disconnect();
    }
    this.statusSubject.next('connecting');
    console.log('[WebSocket] Conectando a diagrama:', diagramId);
    
    // Construye la URL del WebSocket (ajusta host/puerto según entorno)
    let wsUrl = `ws://${window.location.hostname}:8000/ws/diagram/${diagramId}/`;
    if (token) {
      wsUrl += `?token=${token}`;
    }
    console.log('[WebSocket] URL:', wsUrl);
    
    this.socket = new WebSocket(wsUrl);
    this.socket.onopen = () => {
      console.log('[WebSocket] Conexión establecida exitosamente');
      this.statusSubject.next('connected');
    };
    this.socket.onclose = () => {
      console.log('[WebSocket] Conexión cerrada');
      this.statusSubject.next('disconnected');
    };
    this.socket.onerror = (error) => {
      console.error('[WebSocket] Error de conexión:', error);
      this.statusSubject.next('disconnected');
    };
    this.socket.onmessage = (event) => {
      console.log('[WebSocket] Mensaje recibido:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Datos parseados:', data);
        if (data.type && data.payload !== undefined) {
          console.log('[WebSocket] Emitiendo evento:', data);
          this.eventsSubject.next(data as DiagramCollabEvent);
        } else {
          console.warn('[WebSocket] Evento inválido recibido:', data);
        }
      } catch (error) {
        console.error('[WebSocket] Error al parsear mensaje:', error, event.data);
      }
    };
  }

  sendEvent(event: DiagramCollabEvent) {
    console.log('[WebSocket] Intentando enviar evento:', event);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const eventJson = JSON.stringify(event);
      console.log('[WebSocket] Enviando evento JSON:', eventJson);
      this.socket.send(eventJson);
      console.log('[WebSocket] Evento enviado exitosamente');
    } else {
      console.error('[WebSocket] No se puede enviar evento - estado del socket:', 
        this.socket ? this.socket.readyState : 'null');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.statusSubject.next('disconnected');
    }
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
