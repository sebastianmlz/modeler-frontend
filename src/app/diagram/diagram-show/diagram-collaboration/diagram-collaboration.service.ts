import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DiagramCollabEvent } from '../../diagram-collab-event.model';

@Injectable({ providedIn: 'root' })
export class DiagramCollaborationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private eventsSubject = new Subject<DiagramCollabEvent>();
  private statusSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  private windowId = Math.random().toString(36).substr(2, 9); // Unique window identifier

  events$: Observable<DiagramCollabEvent> = this.eventsSubject.asObservable().pipe(
    tap((event: DiagramCollabEvent) => {
      console.log(`[WebSocket-${this.windowId}] 🎯 OBSERVABLE EMITIENDO EVENTO:`, event);
      console.log(`[WebSocket-${this.windowId}] 🎯 Número de subscribers activos:`, (this.eventsSubject as any).observers?.length || 'unknown');
    })
  );
  status$: Observable<'disconnected' | 'connecting' | 'connected'> = this.statusSubject.asObservable();

  connect(diagramId: string, token?: string) {
    console.log(`[WebSocket-${this.windowId}] 🚀 INICIANDO CONEXIÓN PARA VENTANA ${this.windowId}`);
    if (this.socket) {
      console.log(`[WebSocket-${this.windowId}] 🔄 Desconectando socket anterior...`);
      this.disconnect();
    }
    this.statusSubject.next('connecting');
    console.log(`[WebSocket-${this.windowId}] 🚀 CONECTANDO A DIAGRAMA:`, diagramId);
    
    // Construye la URL del WebSocket (ajusta host/puerto según entorno)
    let wsUrl = `ws://${window.location.hostname}:8000/ws/diagram/${diagramId}/`;
    if (token) {
      wsUrl += `?token=${token}`;
    }
    console.log(`[WebSocket-${this.windowId}] 🌐 URL de conexión:`, wsUrl);
    
    try {
      this.socket = new WebSocket(wsUrl);
      console.log('[WebSocket] 🔗 Socket creado, esperando conexión...');
      
      this.socket.onopen = () => {
        console.log(`[WebSocket-${this.windowId}] ✅ CONEXIÓN ESTABLECIDA EXITOSAMENTE`);
        console.log(`[WebSocket-${this.windowId}] ✅ Socket ready state:`, this.socket?.readyState);
        this.statusSubject.next('connected');
      };
      
      this.socket.onclose = (event) => {
        console.warn(`[WebSocket-${this.windowId}] ❌ CONEXIÓN CERRADA`);
        console.warn(`[WebSocket-${this.windowId}] ❌ Close code:`, event.code);
        console.warn(`[WebSocket-${this.windowId}] ❌ Close reason:`, event.reason);
        console.warn(`[WebSocket-${this.windowId}] ❌ Was clean:`, event.wasClean);
        this.statusSubject.next('disconnected');
      };
      
      this.socket.onerror = (error) => {
        console.error(`[WebSocket-${this.windowId}] 💥 ERROR DE CONEXIÓN:`, error);
        console.error(`[WebSocket-${this.windowId}] 💥 Socket state:`, this.socket?.readyState);
        this.statusSubject.next('disconnected');
      };
      
      this.socket.onmessage = (event) => {
        console.log(`[WebSocket-${this.windowId}] � MENSAJE RECIBIDO RAW:`, event.data);
        try {
          const data = JSON.parse(event.data);
          console.log(`[WebSocket-${this.windowId}] � DATOS PARSEADOS:`, data);
          console.log(`[WebSocket-${this.windowId}] � Tipo de evento:`, data.type);
          console.log(`[WebSocket-${this.windowId}] � DiagramId del evento:`, data.diagramId);
          
          if (data.type && data.payload !== undefined) {
            console.log(`[WebSocket-${this.windowId}] ✅ EMITIENDO EVENTO A COMPONENTE:`, data);
            this.eventsSubject.next(data as DiagramCollabEvent);
            console.log(`[WebSocket-${this.windowId}] ✅ Evento emitido exitosamente`);
          } else {
            console.warn('[WebSocket] ⚠️ Evento inválido recibido (falta type o payload):', data);
          }
        } catch (error) {
          console.error('[WebSocket] 💥 ERROR AL PARSEAR MENSAJE:', error);
          console.error('[WebSocket] 💥 Mensaje original:', event.data);
        }
      };
      
    } catch (error) {
      console.error('[WebSocket] 💥 ERROR AL CREAR SOCKET:', error);
      this.statusSubject.next('disconnected');
    }
  }

  sendEvent(event: DiagramCollabEvent) {
    console.log(`[WebSocket-${this.windowId}] 📤 INTENTANDO ENVIAR EVENTO:`, event);
    console.log(`[WebSocket-${this.windowId}] 📤 Tipo de evento:`, event.type);
    console.log(`[WebSocket-${this.windowId}] 📤 DiagramId del evento:`, event.diagramId);
    console.log(`[WebSocket-${this.windowId}] 📤 Estado actual del socket:`, this.socket?.readyState);
    console.log(`[WebSocket-${this.windowId}] 📤 Estados: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3`);
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // SOLUCIÓN: Agregar windowId al evento para identificar el origen
      const eventWithSender = {
        ...event,
        senderId: this.windowId
      };
      
      const eventJson = JSON.stringify(eventWithSender);
      console.log(`[WebSocket-${this.windowId}] 📤 ENVIANDO EVENTO JSON:`, eventJson);
      console.log(`[WebSocket-${this.windowId}] 📤 Longitud del mensaje:`, eventJson.length);
      console.log(`[WebSocket-${this.windowId}] 📤 Sender ID incluido:`, this.windowId);
      
      try {
        this.socket.send(eventJson);
        console.log(`[WebSocket-${this.windowId}] ✅ EVENTO ENVIADO EXITOSAMENTE`);
      } catch (error) {
        console.error(`[WebSocket-${this.windowId}] 💥 ERROR AL ENVIAR:`, error);
      }
    } else {
      console.error(`[WebSocket-${this.windowId}] ❌ NO SE PUEDE ENVIAR EVENTO`);
      console.error(`[WebSocket-${this.windowId}] ❌ Socket existe:`, !!this.socket);
      console.error(`[WebSocket-${this.windowId}] ❌ Estado del socket:`, this.socket?.readyState);
      console.error(`[WebSocket-${this.windowId}] ❌ ¿Es OPEN?:`, this.socket?.readyState === WebSocket.OPEN);
      
      if (this.socket) {
        switch (this.socket.readyState) {
          case WebSocket.CONNECTING:
            console.error(`[WebSocket-${this.windowId}] ❌ Socket aún CONECTANDO...`);
            break;
          case WebSocket.CLOSING:
            console.error(`[WebSocket-${this.windowId}] ❌ Socket CERRÁNDOSE...`);
            break;
          case WebSocket.CLOSED:
            console.error(`[WebSocket-${this.windowId}] ❌ Socket CERRADO`);
            break;
          default:
            console.error(`[WebSocket-${this.windowId}] ❌ Estado desconocido:`, this.socket.readyState);
        }
      } else {
        console.error(`[WebSocket-${this.windowId}] ❌ Socket es NULL`);
      }
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
