/**
 * Standard collaboration event structure for UML diagrams
 * Used for frontend-backend interoperability
 */

/**
 * Available collaboration event types for UML diagrams
 */
export type DiagramCollabEventType =
  | 'add_class'
  | 'update_class'
  | 'move_element'
  | 'delete_class'
  | 'add_relation'
  | 'update_relation'
  | 'delete_relation'
  | 'presence';

/**
 * Collaboration event interface for UML diagram operations
 */
export interface DiagramCollabEvent {
  type: DiagramCollabEventType;
  diagramId: string;
  userId?: string;
  payload: any;
  timestamp?: string;
  senderId?: string;
}
