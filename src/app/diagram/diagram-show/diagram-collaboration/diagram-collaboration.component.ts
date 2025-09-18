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
    if (this.diagramId) {
      this.collaboration.connect(this.diagramId, this.token);
      this.eventsSub = this.collaboration.events$.subscribe(event => {
        console.log('[CollabComponent] Evento recibido del servicio:', event);
        this.eventReceived.emit(event);
        console.log('[CollabComponent] Evento emitido al componente padre');
      });
      this.statusSub = this.collaboration.status$.subscribe(status => {
        console.log('[CollabComponent] Cambio de estado:', status);
        this.statusChanged.emit(status);
      });
    } else {
      console.error('[CollabComponent] No hay diagramId disponible');
    }
  }

  sendEvent(event: DiagramCollabEvent) {
    console.log('[CollabComponent] Enviando evento al servicio:', event);
    this.collaboration.sendEvent(event);
  }

  ngOnDestroy() {
    this.eventsSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.collaboration.disconnect();
  }
}
