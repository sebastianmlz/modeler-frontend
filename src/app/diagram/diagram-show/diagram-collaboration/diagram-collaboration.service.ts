import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DiagramCollabEvent } from '../../diagram-collab-event.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DiagramCollaborationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private eventsSubject = 
  new Subject<DiagramCollabEvent>();
  private statusSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  private _windowId = Math.random().toString(36).substr(2, 9); // Unique window identifier

  events$: Observable<DiagramCollabEvent> = this.eventsSubject.asObservable().pipe(
    tap((event: DiagramCollabEvent) => {
      console.log(`[WebSocket-${this._windowId}] 🎯 OBSERVABLE EMITIENDO EVENTO:`, event);
      console.log(`[WebSocket-${this._windowId}] 🎯 Número de subscribers activos:`, (this.eventsSubject as any).observers?.length || 'unknown');
    })
  );
  status$: Observable<'disconnected' | 'connecting' | 'connected'> = this.statusSubject.asObservable();

  // Getter para acceder al windowId desde otros componentes
  get windowId(): string {
    return this._windowId;
  }

  private buildWebSocketUrl(diagramId: string, token?: string): string {
    // Usar la URL de WebSocket del environment
    const baseWsUrl = (environment as any).wsUrl || environment.apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    // Construir la URL completa
    let fullWsUrl = `${baseWsUrl}/ws/diagram/${diagramId}/`;
    
    // Agregar token si está disponible
    if (token) {
      fullWsUrl += `?token=${encodeURIComponent(token)}`;
    }
    
    return fullWsUrl;
  }

  connect(diagramId: string, token?: string) {
    console.log(`[WebSocket-${this._windowId}] 🚀 INICIANDO CONEXIÓN PARA DIAGRAMA:`, diagramId);
    console.log(`[WebSocket-${this._windowId}] 🚀 Token disponible:`, token ? 'Sí' : 'No');
    
    if (this.socket) {
      console.log(`[WebSocket-${this._windowId}] 🔄 Desconectando socket anterior...`);
      this.disconnect();
    }
    
    this.statusSubject.next('connecting');
    
    // Construir la URL del WebSocket usando el environment
    const wsUrl = this.buildWebSocketUrl(diagramId, token);
    console.log(`[WebSocket-${this._windowId}] 🌐 URL de conexión:`, wsUrl);
    
    try {
      this.socket = new WebSocket(wsUrl);
      console.log('[WebSocket] 🔗 Socket creado, esperando conexión...');
      
      this.socket.onopen = () => {
        console.log(`[WebSocket-${this._windowId}] ✅ CONEXIÓN ESTABLECIDA EXITOSAMENTE`);
        console.log(`[WebSocket-${this._windowId}] ✅ Socket ready state:`, this.socket?.readyState);
        this.statusSubject.next('connected');
      };
      
      this.socket.onclose = (event) => {
        console.warn(`[WebSocket-${this._windowId}] ❌ CONEXIÓN CERRADA`);
        console.warn(`[WebSocket-${this._windowId}] ❌ Code:`, event.code);
        console.warn(`[WebSocket-${this._windowId}] ❌ Reason:`, event.reason);
        console.warn(`[WebSocket-${this._windowId}] ❌ WasClean:`, event.wasClean);
        
        // Códigos específicos del backend
        switch (event.code) {
          case 4003:
            console.error(`[WebSocket-${this._windowId}] ❌ FORBIDDEN - Usuario no autorizado o no es miembro del diagrama`);
            break;
          case 1000:
            console.log(`[WebSocket-${this._windowId}] ✅ Conexión cerrada normalmente`);
            break;
          default:
            console.warn(`[WebSocket-${this._windowId}] ⚠️ Conexión cerrada con código:`, event.code);
        }
        
        this.statusSubject.next('disconnected');
      };
      
      this.socket.onerror = (error) => {
        console.error(`[WebSocket-${this._windowId}] 💥 ERROR DE CONEXIÓN:`, error);
        console.error(`[WebSocket-${this._windowId}] 💥 Socket state:`, this.socket?.readyState);
        this.statusSubject.next('disconnected');
      };
      
      this.socket.onmessage = (event) => {
        console.log(`[WebSocket-${this._windowId}] 📨 MENSAJE RECIBIDO RAW:`, event.data);
        try {
          const data = JSON.parse(event.data);
          console.log(`[WebSocket-${this._windowId}] 📨 DATOS PARSEADOS:`, data);
          
          if (data.type && data.payload !== undefined) {
            // Evitar procesar nuestros propios eventos para prevenir loops
            if (data.senderId && data.senderId === this._windowId) {
              console.log(`[WebSocket-${this._windowId}] 🔄 IGNORANDO evento propio:`, data.type);
              return;
            }
            
            console.log(`[WebSocket-${this._windowId}] ✅ EMITIENDO EVENTO:`, data.type);
            this.eventsSubject.next(data as DiagramCollabEvent);
          } else {
            console.warn(`[WebSocket-${this._windowId}] ⚠️ MENSAJE INVÁLIDO - falta type o payload:`, data);
          }
        } catch (error) {
          console.error(`[WebSocket-${this._windowId}] 💥 ERROR AL PARSEAR MENSAJE:`, error);
          console.error(`[WebSocket-${this._windowId}] 💥 Mensaje original:`, event.data);
        }
      };
      
    } catch (error) {
      console.error('[WebSocket] 💥 ERROR AL CREAR SOCKET:', error);
      this.statusSubject.next('disconnected');
    }
  }

  sendEvent(event: DiagramCollabEvent) {
    console.log(`[WebSocket-${this._windowId}] 📤 INTENTANDO ENVIAR EVENTO:`, event);
    console.log(`[WebSocket-${this._windowId}] 📤 Tipo de evento:`, event.type);
    console.log(`[WebSocket-${this._windowId}] 📤 DiagramId del evento:`, event.diagramId);
    console.log(`[WebSocket-${this._windowId}] 📤 Estado actual del socket:`, this.socket?.readyState);
    console.log(`[WebSocket-${this._windowId}] 📤 Estados: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3`);
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // SOLUCIÓN: Agregar windowId al evento para identificar el origen
      const eventWithSender = {
        ...event,
        senderId: this._windowId
      };
      
      const eventJson = JSON.stringify(eventWithSender);
      console.log(`[WebSocket-${this._windowId}] 📤 ENVIANDO EVENTO JSON:`, eventJson);
      console.log(`[WebSocket-${this._windowId}] 📤 Longitud del mensaje:`, eventJson.length);
      console.log(`[WebSocket-${this._windowId}] 📤 Sender ID incluido:`, this._windowId);
      
      try {
        this.socket.send(eventJson);
        console.log(`[WebSocket-${this._windowId}] ✅ EVENTO ENVIADO EXITOSAMENTE`);
      } catch (error) {
        console.error(`[WebSocket-${this._windowId}] 💥 ERROR AL ENVIAR:`, error);
      }
    } else {
      console.error(`[WebSocket-${this._windowId}] ❌ NO SE PUEDE ENVIAR EVENTO`);
      console.error(`[WebSocket-${this._windowId}] ❌ Socket existe:`, !!this.socket);
      console.error(`[WebSocket-${this._windowId}] ❌ Estado del socket:`, this.socket?.readyState);
      console.error(`[WebSocket-${this._windowId}] ❌ ¿Es OPEN?:`, this.socket?.readyState === WebSocket.OPEN);
      
      if (this.socket) {
        switch (this.socket.readyState) {
          case WebSocket.CONNECTING:
            console.error(`[WebSocket-${this._windowId}] ❌ Socket aún CONECTANDO...`);
            break;
          case WebSocket.CLOSING:
            console.error(`[WebSocket-${this._windowId}] ❌ Socket CERRÁNDOSE...`);
            break;
          case WebSocket.CLOSED:
            console.error(`[WebSocket-${this._windowId}] ❌ Socket CERRADO`);
            break;
          default:
            console.error(`[WebSocket-${this._windowId}] ❌ Estado desconocido:`, this.socket.readyState);
        }
      } else {
        console.error(`[WebSocket-${this._windowId}] ❌ Socket es NULL`);
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
