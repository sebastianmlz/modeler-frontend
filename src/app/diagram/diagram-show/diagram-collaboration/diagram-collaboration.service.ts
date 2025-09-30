import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { DiagramCollabEvent } from '../../diagram-collab-event.model';
import { environment } from '../../../../environments/environment';

/**
 * Service for managing real-time diagram collaboration via WebSocket
 * Handles connection, events, and communication between multiple users
 */
@Injectable({ providedIn: 'root' })
export class DiagramCollaborationService implements OnDestroy {
  private socket: WebSocket | null = null;
  private eventsSubject = 
  new Subject<DiagramCollabEvent>();
  private statusSubject = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  private _windowId = Math.random().toString(36).substr(2, 9); // Unique window identifier
  private lastDiagramId?: string;
  private lastToken?: string;

  events$: Observable<DiagramCollabEvent> = this.eventsSubject.asObservable();
  status$: Observable<'disconnected' | 'connecting' | 'connected'> = this.statusSubject.asObservable();

  // Getter para acceder al windowId desde otros componentes
  get windowId(): string {
    return this._windowId;
  }

  /**
   * Build WebSocket URL for diagram collaboration
   */
  private buildWebSocketUrl(diagramId: string, token?: string): string {
    const baseWsUrl = (environment as any).wsUrl || environment.apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    let fullWsUrl = `${baseWsUrl}/ws/diagram/${diagramId}/`;
    
    if (token) {
      fullWsUrl += `?token=${encodeURIComponent(token)}`;
    }
    
    return fullWsUrl;
  }

  /**
   * Connect to WebSocket for real-time collaboration
   */
  connect(diagramId: string, token?: string) {
    this.lastDiagramId = diagramId;
    this.lastToken = token;
    
    if (this.socket) {
      this.disconnect();
    }
    
    this.statusSubject.next('connecting');
    
    const wsUrl = this.buildWebSocketUrl(diagramId, token);
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        this.statusSubject.next('connected');
      };
      
      this.socket.onclose = () => {
        this.statusSubject.next('disconnected');
      };
      
      this.socket.onerror = () => {
        this.statusSubject.next('disconnected');
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type && data.payload !== undefined) {
            // Avoid processing our own events to prevent loops
            if (data.senderId && data.senderId === this._windowId) {
              return;
            }
            
            this.eventsSubject.next(data as DiagramCollabEvent);
          }
        } catch (error) {
          // Invalid message format
        }
      };
      
    } catch (error) {
      this.statusSubject.next('disconnected');
    }
  }

  /**
   * Send collaboration event to other connected users
   */
  sendEvent(event: DiagramCollabEvent) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const eventWithSender = {
        ...event,
        senderId: this._windowId
      };
      
      try {
        this.socket.send(JSON.stringify(eventWithSender));
      } catch (error) {
        // Error sending event
      }
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.statusSubject.next('disconnected');
    }
  }

  /**
   * Clean up resources on service destruction
   */
  ngOnDestroy() {
    this.disconnect();
  }
}
