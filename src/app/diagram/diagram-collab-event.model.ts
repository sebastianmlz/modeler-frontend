// Estructura estándar de eventos de colaboración para diagramas UML
// Utilizar en frontend y backend para interoperabilidad

/**
 * Evento colaborativo para diagramas UML
 * @property type Tipo de evento (add_class, update_class, move_element, delete_class, add_relation, etc.)
 * @property diagramId ID del diagrama afectado
 * @property userId (opcional) ID del usuario que emite el evento
 * @property payload Objeto con los datos específicos del evento
 * @property timestamp (opcional) Marca de tiempo del evento
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

export interface DiagramCollabEvent {
  type: DiagramCollabEventType;
  diagramId: string;
  userId?: string;
  payload: any;
  timestamp?: string;
  senderId?: string;
}

// Ejemplos de payloads para cada tipo de evento:

// add_class
// {
//   type: 'add_class',
//   diagramId: 'abc123',
//   payload: { class: UMLClass }
// }

// update_class
// {
//   type: 'update_class',
//   diagramId: 'abc123',
//   payload: { classId: 'class_1', changes: { name: 'NuevoNombre', ... } }
// }

// move_element
// {
//   type: 'move_element',
//   diagramId: 'abc123',
//   payload: { elementId: 'class_1', position: { x: 100, y: 200 } }
// }

// delete_class
// {
//   type: 'delete_class',
//   diagramId: 'abc123',
//   payload: { classId: 'class_1' }
// }

// add_relation
// {
//   type: 'add_relation',
//   diagramId: 'abc123',
//   payload: { relation: UMLRelation }
// }

// update_relation
// {
//   type: 'update_relation',
//   diagramId: 'abc123',
//   payload: { relationId: 'rel_1', changes: { name: 'NuevaRel', ... } }
// }

// delete_relation
// {
//   type: 'delete_relation',
//   diagramId: 'abc123',
//   payload: { relationId: 'rel_1' }
// }

// UMLClass y UMLRelation deben coincidir con los modelos de tu frontend/backend.
