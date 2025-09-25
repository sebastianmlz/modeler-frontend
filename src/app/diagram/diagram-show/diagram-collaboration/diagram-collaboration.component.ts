import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { DiagramCollaborationService } from './diagram-collaboration.service';
import { DiagramCollabEvent } from '../../diagram-collab-event.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-diagram-collaboration',
  templateUrl: './diagram-collaboration.component.html',
  styleUrls: ['./diagram-collaboration.component.css']
})
export class DiagramCollaborationComponent implements OnInit, OnDestroy {
  @Input() diagramId!: string;
  @Input() token?: string;
  @Output() eventReceived = new EventEmitter<DiagramCollabEvent>();
  @Output() statusChanged = new EventEmitter<'disconnected' | 'connecting' | 'connected'>();
  @Output() activeMembersChanged = new EventEmitter<string[]>();

  private eventsSub?: Subscription;
  private statusSub?: Subscription;

  constructor(private collaboration: DiagramCollaborationService) {}

  ngOnInit() {
    console.log('[CollabComponent] Inicializando con diagramId:', this.diagramId);
    console.log('[CollabComponent] Token disponible:', this.token ? 'Sí' : 'No');
    
    if (this.diagramId && this.token) {
      console.log('[CollabComponent] 🔄 Iniciando conexión WebSocket...');
      try {
        this.collaboration.connect(this.diagramId, this.token);
        
        this.eventsSub = this.collaboration.events$.subscribe({
          next: (event) => {
            console.log('[CollabComponent] ✅ Evento recibido del servicio:', event);
            this.eventReceived.emit(event);
            console.log('[CollabComponent] ✅ Evento emitido al componente padre');
            
            // Detectar eventos que contengan información de usuarios activos
            this.handleActiveUsersFromEvent(event);
          },
          error: (error) => {
            console.error('[CollabComponent] ❌ Error en eventos:', error);
          }
        });
        
        this.statusSub = this.collaboration.status$.subscribe({
          next: (status) => {
            console.log('[CollabComponent] 🔄 Cambio de estado:', status);
            this.statusChanged.emit(status);
            
            // Cuando nos conectamos, marcarnos como usuario activo
            if (status === 'connected') {
              const currentUserId = this.getCurrentUserId();
              console.log('[CollabComponent] 🔍 Estado conectado - User ID obtenido:', currentUserId);
              if (currentUserId) {
                console.log('[CollabComponent] 👥 Emitiendo usuario conectado:', currentUserId);
                console.log('[CollabComponent] 👥 Emitiendo evento activeMembersChanged con:', [currentUserId]);
                this.activeMembersChanged.emit([currentUserId]);
              } else {
                console.error('[CollabComponent] ❌ No se pudo obtener user_id - no se puede marcar como activo');
              }
            } else if (status === 'disconnected') {
              // Cuando nos desconectamos, limpiar lista de activos
              console.log('[CollabComponent] 👥 Estado desconectado - Emitiendo lista vacía');
              this.activeMembersChanged.emit([]);
            }
          },
          error: (error) => {
            console.error('[CollabComponent] ❌ Error en estado:', error);
          }
        });
      } catch (error) {
        console.error('[CollabComponent] ❌ Error al inicializar colaboración:', error);
        console.log('[CollabComponent] ⚠️ Funcionando en modo local');
      }
    } else {
      console.warn('[CollabComponent] ⚠️ Faltan diagramId o token - modo local únicamente');
      if (!this.diagramId) console.error('[CollabComponent] ❌ No hay diagramId disponible');
      if (!this.token) console.error('[CollabComponent] ❌ No hay token JWT disponible');
    }
  }

  sendEvent(event: DiagramCollabEvent) {
    console.log('[CollabComponent] 📤 Enviando evento colaborativo:', event);
    try {
      this.collaboration.sendEvent(event);
      console.log('[CollabComponent] ✅ Evento enviado correctamente');
    } catch (error) {
      console.error('[CollabComponent] ❌ Error al enviar evento:', error);
      console.log('[CollabComponent] ⚠️ Continuando en modo local');
    }
  }

  private handleActiveUsersFromEvent(event: DiagramCollabEvent) {
    // Si el evento es de tipo 'active_users', emitir la lista de IDs conectados
    if ((event as any).type === 'active_users' && Array.isArray(event.payload)) {
      const ids = event.payload.map((u: any) => u.id?.toString()).filter(Boolean);
      console.log('[CollabComponent] 👥 Usuarios activos recibidos del backend:', ids);
      this.activeMembersChanged.emit(ids);
    }
  }

  private getCurrentUserId(): string | null {
    // Extraer el user_id del JWT token
    if (!this.token) {
      console.log('[CollabComponent] No hay token disponible para extraer user_id');
      return null;
    }
    
    try {
      const parts = this.token.split('.');
      if (parts.length !== 3) {
        console.error('[CollabComponent] Token JWT inválido - no tiene 3 partes');
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('[CollabComponent] Payload del JWT:', payload);
      const userId = payload.user_id?.toString() || null;
      console.log('[CollabComponent] User ID extraído:', userId);
      return userId;
    } catch (error) {
      console.error('[CollabComponent] Error al extraer user_id del token:', error);
      return null;
    }
  }

  ngOnDestroy() {
    this.eventsSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.collaboration.disconnect();
  }
}
