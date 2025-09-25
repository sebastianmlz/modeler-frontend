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
          },
          error: (error) => {
            console.error('[CollabComponent] ❌ Error en eventos:', error);
          }
        });
        
        this.statusSub = this.collaboration.status$.subscribe({
          next: (status) => {
            console.log('[CollabComponent] 🔄 Cambio de estado:', status);
            this.statusChanged.emit(status);
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

  ngOnDestroy() {
    this.eventsSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.collaboration.disconnect();
  }
}
