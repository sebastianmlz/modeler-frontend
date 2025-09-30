import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DiagramCollaborationService } from './diagram-collaboration.service';
import { DiagramCollabEvent } from '../../diagram-collab-event.model';

/**
 * Component for real-time diagram collaboration
 * Manages WebSocket connections and collaborative events
 */
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
    if (this.diagramId && this.token) {
      try {
        this.collaboration.connect(this.diagramId, this.token);
        
        this.eventsSub = this.collaboration.events$.subscribe({
          next: (event) => {
            this.eventReceived.emit(event);
            this.handleActiveUsersFromEvent(event);
          },
          error: () => {}
        });
        
        this.statusSub = this.collaboration.status$.subscribe({
          next: (status) => {
            this.statusChanged.emit(status);
            
            if (status === 'connected') {
              const currentUserId = this.getCurrentUserId();
              if (currentUserId) {
                this.activeMembersChanged.emit([currentUserId]);
              }
            } else if (status === 'disconnected') {
              this.activeMembersChanged.emit([]);
            }
          },
          error: () => {}
        });
      } catch (error) {
        // Fall back to local mode
      }
    }
  }

  /**
   * Send collaboration event to other users
   */
  sendEvent(event: DiagramCollabEvent) {
    try {
      this.collaboration.sendEvent(event);
    } catch (error) {
      // Continue in local mode
    }
  }

  /**
   * Handle active users information from collaboration events
   */
  private handleActiveUsersFromEvent(event: DiagramCollabEvent) {
    if ((event as any).type === 'active_users' && Array.isArray(event.payload)) {
      const ids = event.payload.map((u: any) => u.id?.toString()).filter(Boolean);
      this.activeMembersChanged.emit(ids);
    }
  }

  /**
   * Extract user ID from JWT token
   */
  private getCurrentUserId(): string | null {
    if (!this.token) {
      return null;
    }
    
    try {
      const parts = this.token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.user_id?.toString() || null;
    } catch (error) {
      return null;
    }
  }

  ngOnDestroy() {
    this.eventsSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.collaboration.disconnect();
  }
}
