

// Relación UML para guardar en estructura
export interface UMLRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'Herencia' | 'Asociación' | 'Agregación' | 'Composición' | 'Dependencia' | 'AsociaciónNtoN';
  sourceMultiplicity?: string; // Ej: '1', '0..1', '1..*', '*'
  targetMultiplicity?: string; // Ej: '1', '0..1', '1..*', '*'
  name?: string; // Nombre de la relación (opcional)
  associationClassId?: string; // Solo para NtoN: id de la clase intermedia generada
}
// NOTA: Para 'AsociaciónNtoN', al crear la relación se debe crear automáticamente una clase intermedia
// con dos atributos PK (referencias a las PK de las clases padres) y conectarla visualmente.



// Array real de clases UML




// --- MODELOS UML PARA SNAPSHOT Y FRONTEND ---
// --- MODELOS UML PARA SNAPSHOT Y FRONTEND ---
// (deja solo interfaces y constantes fuera de la clase)
export interface UMLAttribute {
  id: string;
  name: string;
  typeName: string;
  isRequired: boolean;
  isPrimaryKey: boolean;
  position: number;
}

export interface UMLClass {
  id: string;
  name: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'PROTECTED';
  position: { x: number; y: number };
  size: { w: number; h: number };
  attributes: UMLAttribute[];
}

export const ATTRIBUTE_TYPES = [
  'string', 'int', 'long', 'boolean', 'float', 'double', 'date', 'datetime', 'BigDecimal'
];


import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CollabMember } from './collab-member.model';
import { DiagramCollabEvent } from '../diagram-collab-event.model';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramVersionService } from './diagram-version.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShowSidebarComponent } from './show-sidebar/show-sidebar.component';
import { DiagramModule, NodeModel, ConnectorModel, DiagramComponent, NodeConstraints } from '@syncfusion/ej2-angular-diagrams';
import { DiagramCollaborationComponent } from './diagram-collaboration/diagram-collaboration.component';
import { DiagramAiSuggestionsComponent } from './diagram-ai-suggestions/diagram-ai-suggestions.component';
import { DiagramAiPromptComponent } from './diagram-ai-prompt/diagram-ai-prompt.component';
import { MembersService } from './members.service';
import { UMLSuggestion, UMLSuggestionsResponse } from '../../core/ai.service';

// ...existing code...

@Component({
  selector: 'app-diagram-show',
  standalone: true,
  imports: [CommonModule, FormsModule, ShowSidebarComponent, DiagramModule,DiagramCollaborationComponent, DiagramAiSuggestionsComponent, DiagramAiPromptComponent],
  templateUrl: './diagram-show.component.html',
  styleUrl: './diagram-show.component.css'
})
export class DiagramShowComponent implements OnInit, OnDestroy, AfterViewInit {
    // Miembros colaborativos conectados en tiempo real
  collabMembers: any[] = [];
  // Lista de miembros conectados en tiempo real (IDs)
  activeMemberIds: Set<string> = new Set();
  @ViewChild('collabComp', { static: false }) collabComp!: DiagramCollaborationComponent;
  @ViewChild('aiSuggestionsComp', { static: false }) aiSuggestionsComp!: DiagramAiSuggestionsComponent;
  @ViewChild('aiPromptComp', { static: false }) aiPromptComp!: DiagramAiPromptComponent;

  // Maneja cambios de estado de la colaboración (opcional: puedes mostrar estado en UI si lo deseas)
  onCollabStatus(status: 'disconnected' | 'connecting' | 'connected') {
  }
  // --- Métodos para colaboración en tiempo real ---
  // Maneja eventos recibidos desde el WebSocket de colaboración
  onCollabEvent(event: DiagramCollabEvent) {
    if (!event || !event.type) {
      return;
    }
    
    // FILTRAR NUESTROS PROPIOS EVENTOS PARA EVITAR CICLOS
    if ((event as any).senderId && this.collabComp) {
      const ourWindowId = (this.collabComp as any).collaboration?.windowId;
      if (ourWindowId && (event as any).senderId === ourWindowId) {
        return;
      }
    }
    
    switch (event?.type) {
      case 'add_class': {
        const newClass = event.payload.class;
        if (!this.umlClasses.find(c => c.id === newClass.id)) {
          this.umlClasses.push(newClass);
          // Crear nodo visual
          let content = newClass.name;
          if (newClass.attributes && newClass.attributes.length > 0) {
            content += '\n' + '─'.repeat(Math.max(newClass.name.length, 10)) + '\n';
            content += newClass.attributes.map((attr: any) => {
              let line = attr.name + ': ' + attr.typeName;
              if (attr.isPrimaryKey) line += ' [PK]';
              return line;
            }).join('\n');
          }
          const lines = content.split('\n');
          const maxLineLength = Math.max(...lines.map((line: string) => line.length));
          const newWidth = Math.max(150, maxLineLength * 8 + 20);
          const newHeight = Math.max(80, lines.length * 20 + 20);
          const newNode: NodeModel = {
            id: newClass.id,
            offsetX: newClass.position.x,
            offsetY: newClass.position.y,
            width: newWidth,
            height: newHeight,
            annotations: [{ content }],
            style: { fill: '#ffffff', strokeColor: '#000000', strokeWidth: 2 },
            constraints: NodeConstraints.Default | NodeConstraints.Drag
          };
          this.nodes.push(newNode);
          if (this.diagramComponent) {
            this.diagramComponent.addNode(newNode);
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.nodes = [...this.diagramComponent.nodes];
            if (this.diagramComponent.connectors) {
              this.diagramComponent.connectors = [...this.connectors];
            }
            
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
            
            // Verificar el ID después de agregar
            setTimeout(() => {
              const addedNode = this.diagramComponent.getNodeObject(newNode.id!);
              if (addedNode) {
              } else {
                // Buscar todos los nodos en el diagrama
              }
            }, 100);
          }
        }
        // Notificar al componente de sugerencias IA sobre la nueva clase
        this.notifyAISuggestionsOfExternalChange('Otro usuario agregó la clase ' + newClass.name);
        break;
      }
      case 'add_relation': {
        const rel = event.payload.relation;
        if (!this.umlRelations.find(r => r.id === rel.id)) {
          this.umlRelations.push(rel);
          let connector: ConnectorModel = {
            id: rel.id,
            sourceID: rel.sourceId,
            targetID: rel.targetId,
            type: 'Orthogonal',
            style: { strokeColor: '#222', strokeWidth: 2 },
            targetDecorator: { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } }
          };
          switch (rel.type) {
            case 'Herencia':
              connector.targetDecorator = { shape: 'Arrow', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Asociación':
              connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Agregación':
              connector.targetDecorator = { shape: 'Diamond', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Composición':
              connector.targetDecorator = { shape: 'Diamond', style: { fill: '#222', strokeColor: '#222', strokeWidth: 2 } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Dependencia':
              connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
              connector.style = { strokeColor: '#222', strokeWidth: 2, strokeDashArray: '4 2' };
              break;
          }
          this.connectors.push(connector);
          if (this.diagramComponent) {
            this.diagramComponent.addConnector(connector);
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.connectors = [...this.connectors];
            if (this.diagramComponent.nodes) {
              this.diagramComponent.nodes = [...this.nodes];
            }
            
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
        }
        // Notificar al componente de sugerencias IA sobre la nueva relación
        this.notifyAISuggestionsOfExternalChange('Otro usuario agregó una relación ' + rel.type);
        break;
      }
      case 'delete_relation': {
        const relationId = event.payload.relationId;
        
        // Activar bandera para evitar eventos circulares
        this.isApplyingCollabChange = true;
        
        // Actualizar datos locales
        this.umlRelations = this.umlRelations.filter(rel => rel.id !== relationId);
        this.connectors = this.connectors.filter(c => c.id !== relationId);
        
        if (this.diagramComponent) {
          const connector = this.diagramComponent.getConnectorObject(relationId);
          if (connector) {
            this.diagramComponent.remove(connector);
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.connectors = [...this.connectors];
            this.diagramComponent.nodes = [...this.nodes];
            
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          } else {
          }
        }
        
        // Resetear selección si se eliminó la relación seleccionada
        if (this.selectedUMLRelationId === relationId) {
          this.selectedUMLRelationId = null;
        }
        
        // Desactivar bandera
        setTimeout(() => {
          this.isApplyingCollabChange = false;
        }, 100);
        
        break;
      }
      case 'update_class': {
          const { classId, changes } = event.payload;
 
        
        // Activar bandera para evitar eventos circulares
        this.isApplyingCollabChange = true;
        
        try {
          // Actualizar datos de la clase
          const idx = this.umlClasses.findIndex(c => c.id === classId);
          if (idx !== -1) {
            this.umlClasses[idx] = { ...this.umlClasses[idx], ...changes };
          } else {
            break;
          }
          
          // Actualizar nodo visual
          const nodeIdx = this.nodes.findIndex(n => n.id === classId);
          if (nodeIdx !== -1) {
            
            // Generar contenido actualizado del nodo
            let content = this.umlClasses[idx].name;
            if (this.umlClasses[idx].attributes && this.umlClasses[idx].attributes.length > 0) {
              content += '\n' + '─'.repeat(Math.max(this.umlClasses[idx].name.length, 10)) + '\n';
              content += this.umlClasses[idx].attributes.map((attr: any) => {
                let line = attr.name + ': ' + attr.typeName;
                if (attr.isPrimaryKey) line += ' [PK]';
                return line;
              }).join('\n');
            }
            
            const lines = content.split('\n');
            const maxLineLength = Math.max(...lines.map((line: string) => line.length));
            const newWidth = Math.max(150, maxLineLength * 8 + 20);
            const newHeight = Math.max(80, lines.length * 20 + 20);
            
            this.nodes[nodeIdx] = {
              ...this.nodes[nodeIdx],
              annotations: [{ content }],
              width: newWidth,
              height: newHeight
            };
            
            
            if (this.diagramComponent) {
              const nodeObj = this.diagramComponent.getNodeObject(classId);
              if (nodeObj) {
                this.diagramComponent.remove(nodeObj);
              }
              this.diagramComponent.add(this.nodes[nodeIdx]);
              
              // Actualizar referencias de arrays para sincronización
              this.diagramComponent.nodes = [...this.nodes];
              this.diagramComponent.connectors = [...this.connectors];
              
              this.diagramComponent.dataBind();
              this.diagramComponent.refresh();
            }
          } else {
          }
          
          
          // Notificar al componente de sugerencias IA sobre el cambio externo
          const updatedClass = event.payload.class;
          this.notifyAISuggestionsOfExternalChange('Otro usuario actualizó la clase ' + updatedClass.name);
        } catch (error) {
        } finally {
          // Desactivar bandera después de un pequeño delay
          setTimeout(() => {
            this.isApplyingCollabChange = false;
          }, 100);
        }
        
        break;
      }
      case 'move_element': {
        const { elementId, position } = event.payload;

        
        // Activar bandera para evitar eventos circulares
        this.isApplyingCollabChange = true;
        
        try {
          // Actualizar posición en datos
          const classIdx = this.umlClasses.findIndex(c => c.id === elementId);
          if (classIdx !== -1) {
            this.umlClasses[classIdx].position = { ...position };
          } else {
          }
          
          // Actualizar nodo visual
          const nodeIdx = this.nodes.findIndex(n => n.id === elementId);
          if (nodeIdx !== -1) {
            this.nodes[nodeIdx].offsetX = position.x;
            this.nodes[nodeIdx].offsetY = position.y;
            
            // Actualizar visualmente en el diagrama
            if (this.diagramComponent) {
              
              try {
                // Buscar en nodes array del diagrama
                let nodeObj = null;
                if (this.diagramComponent.nodes) {
                  nodeObj = this.diagramComponent.nodes.find(n => n.id === elementId);
                }
                
                if (nodeObj) {
                  
                  // Actualizar posición del nodo
                  nodeObj.offsetX = position.x;
                  nodeObj.offsetY = position.y;
                  
                  // CLAVE: Crear nueva referencia del array para forzar detección de cambios de Angular
                  this.diagramComponent.nodes = [...this.diagramComponent.nodes];
                  
                  // IMPORTANTE: También actualizar conectores para mantener relaciones visibles
                  if (this.diagramComponent.connectors && this.connectors) {
                    this.diagramComponent.connectors = [...this.connectors];
                  }
                  
                  try {
                    this.diagramComponent.dataBind();
                  } catch (e) {
                  }
                  
                  try {
                    this.diagramComponent.refresh();
                  } catch (e) {
                  }
                  
                } else {
                  
                  // Método de fallback: Actualizar todo el diagrama
                  try {
                    // Sincronizar arrays completos
                    this.diagramComponent.nodes = [...this.nodes];
                    this.diagramComponent.connectors = [...this.connectors];
                    this.diagramComponent.dataBind();
                    this.diagramComponent.refresh();
                  } catch (e) {
                  }
                }
              } catch (error) {
              }
            } else {
            }
          } else {
          }
        } catch (error) {
        }
        
        // Desactivar bandera después de un delay más largo para evitar ciclos
        setTimeout(() => {
          this.isApplyingCollabChange = false;
        }, 300); // Reducido a 300ms para mejor responsividad
        
        break;
      }
      case 'delete_class': {
        const classId = event.payload.classId;
        
        // Activar bandera para evitar eventos circulares
        this.isApplyingCollabChange = true;
        
        try {
          // 1. Eliminar relaciones que usan esta clase
          const relationsToDelete = this.umlRelations.filter(
            rel => rel.sourceId === classId || rel.targetId === classId
          );
          
          relationsToDelete.forEach(rel => {
            
            // Eliminar de array UML
            this.umlRelations = this.umlRelations.filter(r => r.id !== rel.id);
            
            // Eliminar conector visual
            this.connectors = this.connectors.filter(c => c.id !== rel.id);
            
            // Eliminar del diagrama si existe
            if (this.diagramComponent) {
              const connector = this.diagramComponent.getConnectorObject(rel.id);
              if (connector) {
                this.diagramComponent.remove(connector);
              }
            }
          });
          
          // 2. Eliminar la clase del array UML
          const classIndex = this.umlClasses.findIndex(c => c.id === classId);
          if (classIndex !== -1) {
            this.umlClasses.splice(classIndex, 1);
          }
          
          // 3. Eliminar nodo visual del diagrama
          const nodeIndex = this.nodes.findIndex(n => n.id === classId);
          if (nodeIndex !== -1) {
            this.nodes.splice(nodeIndex, 1);
          }
          
          // 4. Eliminar del diagrama visual
          if (this.diagramComponent) {
            const nodeObj = this.diagramComponent.getNodeObject(classId);
            if (nodeObj) {
              this.diagramComponent.remove(nodeObj);
            }
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.nodes = [...this.nodes];
            this.diagramComponent.connectors = [...this.connectors];
            
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
          
          // 5. Limpiar selección si era la clase eliminada
          if (this.selectedUMLClass?.id === classId) {
            this.selectedUMLClass = null;
          }
          
        } catch (error) {
        } finally {
          // Desactivar bandera después de un pequeño delay
          setTimeout(() => {
            this.isApplyingCollabChange = false;
          }, 100);
        }
        
        break;
      }
      default:
    }
    
    // REMOVED: Auto-guardado colaborativo para evitar race conditions
    // Solo la ventana que origina el cambio debe auto-guardar
    // this.autoSaveDiagram();
  }
  // Maneja la selección de nodos o relaciones en el canvas
  onSelectionChange(event: any) {
    if (!event || !event.newValue || event.newValue.length === 0) {
      this.selectedUMLClass = null;
      this.selectedUMLRelationId = null;
      return;
    }
    const selected = event.newValue[0];
    // Si hay tipo de relación seleccionado, usar lógica de selección de nodos para crear relación
    if (this.selectedRelationType && selected && (selected.shape || selected.annotations)) {
      const nodeId = selected.id;
      if (!this.selectedSourceNodeId) {
        this.selectedSourceNodeId = nodeId;
        return;
      }
      if (!this.selectedTargetNodeId && nodeId !== this.selectedSourceNodeId) {
        this.selectedTargetNodeId = nodeId;
        this.createRelationConnector();
      }
      // No abrir panel de edición en modo relación
      return;
    }
    // Si no hay tipo de relación seleccionado, comportamiento normal
    if (selected && (selected.shape || selected.annotations)) {
      const umlClass = this.getUMLClassByNodeId(selected.id);
      if (umlClass) {
        this.openClassPanel(umlClass);
        this.selectedUMLRelationId = null;
        return;
      }
    }
    // Si es un conector (relación), abrir panel de relación
    if (selected && selected.id) {
      // Buscar relación por id
      let rel = this.umlRelations.find(r => r.id === selected.id);
      // Si no se encuentra por id, buscar por source/target
      if (!rel && selected.sourceID && selected.targetID) {
        rel = this.umlRelations.find(r => r.sourceId === selected.sourceID && r.targetId === selected.targetID);
      }
      if (rel) {
        this.selectedUMLClass = null;
        this.selectedUMLRelationId = rel.id;
        this.openRelationPanel(rel.id);
        return;
      }
    }
    // Si no es clase ni relación conocida
    this.selectedUMLClass = null;
    this.selectedUMLRelationId = null;
  }

  // Maneja cuando se mueve un elemento (método único y simple)
  onElementMoved(event: any) {
    // Validar evento
    if (!event?.element?.id) {
      return;
    }
    
    // No procesar si estamos aplicando cambio colaborativo
    if (this.isApplyingCollabChange) {
      return;
    }
    
    const elementId = event.element.id;
    const newX = event.element.offsetX;
    const newY = event.element.offsetY;
    
    // Verificar que es uno de nuestros elementos
    const isOurElement = this.nodes.find(n => n.id === elementId);
    if (!isOurElement) {
      return;
    }
    
    
    // Actualizar datos locales
    this.updateLocalPosition(elementId, newX, newY);
    
    // Enviar evento colaborativo
    this.sendMoveEvent(elementId, newX, newY);
  }

  // Evento que se dispara cuando cambian propiedades del diagrama
  onPropertyChange(event: any) {
    // El evento puede tener diferentes estructuras
    let element = event?.element;
    let propertyName = event?.propertyName;
    let elementId = event?.element?.id;
    
    // Si element es undefined, pero hay otras propiedades, buscar el elemento de otra manera
    if (!element && event) {
      // Buscar propiedades que indiquen un elemento
      if (event.cause === 'ToolAction') {
        // Buscar el elemento en el diagrama que se esté moviendo
        if (this.diagramComponent && this.diagramComponent.selectedItems && 
            this.diagramComponent.selectedItems.nodes && 
            this.diagramComponent.selectedItems.nodes.length > 0) {
          element = this.diagramComponent.selectedItems.nodes[0];
        }
      }
    }
    
    // Detectar eventos de movimiento de manera más amplia
    const isMovementEvent = (
      // Caso 1: Evento con element válido y propertyName de posición
      (element && element.id && (propertyName === 'offsetX' || propertyName === 'offsetY')) ||
      // Caso 2: Evento sin propertyName pero con element válido (movimiento por drag)
      (element && element.id && !propertyName) ||
      // Caso 3: Evento de ToolAction (arrastrar y soltar)
      (event?.cause === 'ToolAction' && element) ||
      // Caso 4: Si no hay element pero hay evento de tool action, buscar elemento seleccionado
      (event?.cause === 'ToolAction' && !element && 
       this.diagramComponent && this.diagramComponent.selectedItems && 
       this.diagramComponent.selectedItems.nodes && 
       this.diagramComponent.selectedItems.nodes.length > 0)
    );
    
    // Si no hay element pero parece ser movimiento, intentar obtenerlo
    if (isMovementEvent && !element && event?.cause === 'ToolAction') {
      if (this.diagramComponent && this.diagramComponent.selectedItems && 
          this.diagramComponent.selectedItems.nodes && 
          this.diagramComponent.selectedItems.nodes.length > 0) {
        element = this.diagramComponent.selectedItems.nodes[0];
      }
    }
    
    // Verificar si es un cambio de posición
    if (isMovementEvent && element) {    
      // Si no tiene ID, intentar encontrarlo por posición
      let elementToProcess = element;
      if (!element.id) {
        const currentPos = { x: element.offsetX || 0, y: element.offsetY || 0 };
        
        const nodeByPosition = this.nodes.find(n => 
          Math.abs((n.offsetX || 0) - currentPos.x) < 10 && 
          Math.abs((n.offsetY || 0) - currentPos.y) < 10
        );
        
        if (nodeByPosition) {
          elementToProcess = {
            ...element,
            id: nodeByPosition.id
          };
        } else {
          return;
        }
      }
      
      // Verificar que es uno de nuestros elementos
      const realElement = this.nodes.find(n => n.id === elementToProcess.id);
      if (!realElement) {
        return;
      }
      
      // Usar las coordenadas actuales del elemento del diagrama
      const elementToUse = {
        ...realElement,
        offsetX: elementToProcess.offsetX || realElement.offsetX,
        offsetY: elementToProcess.offsetY || realElement.offsetY
      };
      this.handlePositionChangeDebounced(elementToUse);
    } else {
    }
  }

  // Evento cuando se crea el diagrama
  onDiagramCreated(event: any) {
  }

  // Debounce para manejar cambios de posición
  private positionChangeTimeout: any = null;
  
  private handlePositionChangeDebounced(element: any) {
    
    if (this.isApplyingCollabChange) {
      return;
    }

    // Cancelar timeout anterior
    if (this.positionChangeTimeout) {
      clearTimeout(this.positionChangeTimeout);
    }

    // Procesar después de un pequeño delay
    this.positionChangeTimeout = setTimeout(() => {
      this.updateLocalPosition(element.id, element.offsetX, element.offsetY);
      this.sendMoveEvent(element.id, element.offsetX, element.offsetY);
    }, 100);
  }
  
  private updateLocalPosition(elementId: string, x: number, y: number) {
    // Actualizar nodo
    const nodeIdx = this.nodes.findIndex(n => n.id === elementId);
    if (nodeIdx !== -1) {
      this.nodes[nodeIdx].offsetX = x;
      this.nodes[nodeIdx].offsetY = y;
    }
    
    // Actualizar clase UML
    const classIdx = this.umlClasses.findIndex(c => c.id === elementId);
    if (classIdx !== -1) {
      this.umlClasses[classIdx].position = { x, y };
    }
    
    // Auto-guardar los cambios locales
    this.autoSaveDiagram();
  }
  
  private sendMoveEvent(elementId: string, x: number, y: number) {
    
    if (!this.collabComp) {
      return;
    }
    
    const moveEvent = {
      type: 'move_element' as const,
      diagramId: this.diagramId,
      payload: {
        elementId: elementId,
        position: { x, y }
      }
    };
    
    
    try {
      this.collabComp.sendEvent(moveEvent);
    } catch (error) {
    }
  }

  // ===== SISTEMA DE MONITOREO DE POSICIONES (RESPALDO) =====
  
  // Inicializar el monitoreo de posiciones
  private startPositionMonitoring() {
    // Limpiar interval anterior si existe
    if (this.positionMonitorInterval) {
      clearInterval(this.positionMonitorInterval);
    }
    
    // Monitorear cada 500ms
    this.positionMonitorInterval = setInterval(() => {
      this.checkPositionChanges();
    }, 500);
  }
  
  // Verificar cambios de posición
  private checkPositionChanges() {
    // Monitor deshabilitado. No hacer nada.
    return;
  }
  
  // Actualizar posiciones conocidas cuando se cargan nodos
  private updateKnownPositions() {
    this.lastKnownPositions.clear();
    
    if (this.diagramComponent && this.diagramComponent.nodes) {
      this.diagramComponent.nodes.forEach((node: any) => {
        if (node.id) {
          this.lastKnownPositions.set(node.id, {
            x: node.offsetX || 0,
            y: node.offsetY || 0
          });
        }
      });
    }
  }
  
  // Detener el monitoreo
  private stopPositionMonitoring() {
    if (this.positionMonitorInterval) {
      clearInterval(this.positionMonitorInterval);
      this.positionMonitorInterval = null;
    }
  }

  // Tipos de datos básicos para atributos
  attributeTypes = [
    'string', 'int', 'long', 'boolean', 'float', 'double', 'date', 'datetime', 'BigDecimal'
  ];

  // Clase seleccionada para edición
  selectedUMLClass: UMLClass | null = null;

  // Actualiza la clase seleccionada en el canvas solo cuando se presiona el botón
  updateSelectedClassOnCanvas() {
    
    if (!this.selectedUMLClass) {
      return;
    }
    
    // Crear una copia de la clase antes de proceder para evitar referencias null
    const classToUpdate = { ...this.selectedUMLClass };
    
    // Validar que la clase tenga ID válido
    if (!classToUpdate.id) {
      return;
    }
    
    // Usar el método unificado que replica exactamente esta lógica
    this.updateAndSyncClass(classToUpdate.id);
  }
  // Array real de clases UML
  umlClasses: UMLClass[] = [];

  umlRelations: UMLRelation[] = [];

  // Devuelve true si ya hay un PK en la clase
  get hasPrimaryKey(): boolean {
    return this.selectedUMLClass?.attributes.some(a => a.isPrimaryKey) ?? false;
  }

  // Abrir panel de edición al seleccionar clase (ejemplo: desde evento de selección)
  openClassPanel(umlClass: UMLClass) {
    this.selectedUMLClass = umlClass;
  }

  closeClassPanel() {
    this.selectedUMLClass = null;
  }

  addAttribute() {
    if (!this.selectedUMLClass) return;
    const nextPos = this.selectedUMLClass.attributes.length;
    this.selectedUMLClass.attributes.push({
      id: 'A' + Date.now() + '_' + Math.floor(Math.random()*1000),
      name: '',
      typeName: 'string',
      isRequired: false,
      isPrimaryKey: false,
      position: nextPos
    });
  }

  removeAttribute(idx: number) {
    if (!this.selectedUMLClass) return;
    this.selectedUMLClass.attributes.splice(idx, 1);
  }

  setPrimaryKey(idx: number) {
    if (!this.selectedUMLClass) return;
    this.selectedUMLClass.attributes.forEach((a, i) => a.isPrimaryKey = i === idx);
  }

  attributeNameExists(name: string, idx: number): boolean {
    if (!this.selectedUMLClass) return false;
    return this.selectedUMLClass.attributes.some((a, i) => a.name === name && i !== idx);
  }
  @ViewChild('umlDiagram', { static: false }) diagramComponent!: DiagramComponent;
  diagramId: string = '';
  versionId: string = '';
  token: string = '';
  savingVersion: boolean = false;
  saveError: string = '';
  // Bandera para evitar eventos circulares en colaboración
  private isApplyingCollabChange: boolean = false;
  // Control de auto-guardado
  private autoSaveTimeout: any = null;
  
  // Sistema de monitoreo de posiciones como respaldo
  private lastKnownPositions: Map<string, { x: number, y: number }> = new Map();
  private positionMonitorInterval: any = null;

  // === PROPIEDADES PARA SUGERENCIAS DE IA ===
  showAISuggestions: boolean = false;
  showVoicePrompt: boolean = false;
  currentSnapshot: any = null;

  // Sincroniza los arrays de datos con los visuales antes de guardar
  syncDataFromVisuals() {
    // Sincronizar posiciones de clases existentes desde los nodos
    this.nodes.forEach(node => {
      const classIndex = this.umlClasses.findIndex(cls => cls.id === node.id);
      if (classIndex !== -1) {
        // Actualizar solo la posición, preservar otros datos
        this.umlClasses[classIndex].position = { 
          x: node.offsetX || 0, 
          y: node.offsetY || 0 
        };
        this.umlClasses[classIndex].size = { 
          w: node.width || 150, 
          h: node.height || 80 
        };
      } else {
        // Si hay un nodo sin clase correspondiente, crear una clase mínima
        const newClass = {
          id: node.id || '',
          name: node.annotations?.[0]?.content?.split('\n')[0] || 'Clase',
          visibility: 'PUBLIC' as const,
          position: { x: node.offsetX || 0, y: node.offsetY || 0 },
          size: { w: node.width || 150, h: node.height || 80 },
          attributes: []
        };
        this.umlClasses.push(newClass);
      }
    });
    
    // Remover clases que no tienen nodos correspondientes
    this.umlClasses = this.umlClasses.filter(cls => 
      this.nodes.some(node => node.id === cls.id)
    );
  }

  saveDiagramVersion() {
    this.savingVersion = true;
    this.saveError = '';
    // Sincronizar datos antes de guardar
    this.syncDataFromVisuals();
    // Armar snapshot
    const snapshot = {
      classes: this.umlClasses,
      relations: this.umlRelations,
      metadata: {}
    };
    // Puedes pedir el mensaje al usuario o dejar uno por defecto
    const message = 'Versión guardada desde el editor';
    // El id del diagrama puede venir de la ruta o variable
    const diagramId = this.diagramId || '';
    this.versionService.createVersion(diagramId, snapshot, message).subscribe({
      next: () => {
        this.savingVersion = false;
        // Actualizar snapshot para sugerencias de IA
        this.updateSnapshotForAI();
        alert('¡Versión guardada exitosamente!');
      },
      error: (err) => {
        this.savingVersion = false;
        this.saveError = 'Error al guardar versión';
        alert('Error al guardar versión');
      }
    });
  }

  // Guardado automático para cambios colaborativos
  autoSaveDiagram() {
    // Evitar múltiples guardados simultáneos
    if (this.savingVersion) return;
    
    // Cancelar auto-guardado anterior si existe
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    // Programar auto-guardado con debounce de 2 segundos
    this.autoSaveTimeout = setTimeout(() => {
      // Sincronizar datos antes de guardar
      this.syncDataFromVisuals();
      // Armar snapshot
      const snapshot = {
        classes: this.umlClasses,
        relations: this.umlRelations,
        metadata: {}
      };
      const message = 'Auto-guardado por cambio colaborativo';
      const diagramId = this.diagramId || '';
      
      this.versionService.createVersion(diagramId, snapshot, message).subscribe({
        next: () => {
        },
        error: (err) => {
        }
      });
      
      this.autoSaveTimeout = null;
    }, 2000); // Debounce de 2 segundos
  }

  loadingVersion: boolean = false;
  loadError: string = '';
  selectedRelationType: string = '';


  // Arrays de nodos y conectores, se poblarán solo desde snapshot
  public nodes: NodeModel[] = [];
  public connectors: ConnectorModel[] = [];

  // Configuración de selección para Syncfusion Diagram
  public selectedItems = {
    constraints: 1 // Selector simple
  };


  selectedSourceNodeId: string | null = null;
  selectedTargetNodeId: string | null = null;
  selectedUMLRelationId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private versionService: DiagramVersionService,
    private router: Router,
    private membersService: MembersService
  ) {}
  // Redirige a diagram-export con el snapshot actual
  exportSpringBootBackend() {
    this.syncDataFromVisuals();
    const snapshot = {
      classes: this.umlClasses,
      relations: this.umlRelations,
      metadata: {}
    };
    // Navegar a diagram-export pasando el snapshot como estado
    this.router.navigate(['/diagram/export'], { state: { snapshot } });
  }


    ngOnInit(): void {
      // Obtener diagramId de la URL
      this.diagramId = this.route.snapshot.paramMap.get('id') || '';
      // Obtener versionId de la URL (puede venir como route param o query param)
      this.versionId = this.route.snapshot.paramMap.get('versionId') || this.route.snapshot.queryParamMap.get('versionId') || '';
      // Obtener token JWT del localStorage para WebSocket
      this.token = localStorage.getItem('access') || '';

      if (this.diagramId) {
        // Cargar miembros del diagrama
        this.membersService.getDiagramMembers(this.diagramId).subscribe({
          next: (resp: { members: { id: string; name: string; email?: string; avatarUrl?: string }[] }) => {
            // Al cargar los miembros, fusionar con el estado de conexión actual
            this.updateCollabMembers(resp.members || []);
          },
          error: (err: unknown) => {
          }
        });
        // Si hay versionId en la URL, cargar esa versión específica
        if (this.versionId) {
          this.loadSpecificVersion(this.versionId);
        } else {
          // Si no hay versionId, cargar la última versión
          this.loadLatestVersion();
        }
      } else {
      }
    }

    // Escuchar cambios de miembros conectados en tiempo real

    onActiveMembersChanged(activeIds: string[]) {
      
      this.activeMemberIds = new Set(activeIds);
      
      // Actualizar la propiedad isActive en collabMembers
      const updatedMembers = this.collabMembers.map(m => {
        const isActive = this.activeMemberIds.has(m.id.toString());
        return { ...m, isActive };
      });
      this.collabMembers = updatedMembers;
    }

    // Fusiona la lista de miembros del backend con el estado de conexión actual
    updateCollabMembers(members: { id: string; name: string; email?: string; avatarUrl?: string }[]) {
      this.collabMembers = members.map(m => ({ ...m, isActive: this.activeMemberIds.has(m.id) }));
    }

  // Cargar una versión específica
  private loadSpecificVersion(versionId: string): void {
    this.loadingVersion = true;
    this.versionService.getVersion(versionId).subscribe({
      next: (data) => {
        this.loadingVersion = false;
        if (data && data.snapshot) {
          this.loadSnapshotToCanvas(data.snapshot);
        } else {
        }
      },
      error: (err) => {
        this.loadingVersion = false;
      }
    });
  }

  // Cargar la versión más reciente del diagrama
  private loadLatestVersion(): void {
    this.loadingVersion = true;
    this.versionService.listVersions(this.diagramId, '-created_at').subscribe({
      next: (response: any) => {
        this.loadingVersion = false;
        if (response && response.results && response.results.length > 0) {
          // Obtener la versión más reciente (primera en la lista ordenada por fecha desc)
          const latestVersion = response.results[0];
          this.loadSpecificVersion(latestVersion.id);
        } else {
        }
      },
      error: (err: any) => {
        this.loadingVersion = false;
      }
    });
  }

  // Cargar snapshot en el canvas y en las estructuras
  loadSnapshotToCanvas(snapshot: any) {
    // Permitir snapshot anidado (caso backend)
    const snap = snapshot && snapshot.snapshot ? snapshot.snapshot : snapshot;
    // Limpiar arrays
    this.umlClasses = [];
    this.umlRelations = [];
    this.nodes = [];
    this.connectors = [];
    // Poblar clases
    if (snap.classes) {
      this.umlClasses = snap.classes;
      this.nodes = this.umlClasses.map(cls => {
        // Formatear contenido UML: nombre, línea, atributos
        let content = cls.name;
        if (cls.attributes && cls.attributes.length > 0) {
          content += '\n' + '─'.repeat(Math.max(cls.name.length, 10)) + '\n';
          content += cls.attributes.map(attr => {
            let line = attr.name + ': ' + attr.typeName;
            if (attr.isPrimaryKey) line += ' [PK]';
            return line;
          }).join('\n');
        }
        // Calcular tamaño según contenido
        const lines = content.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const newWidth = Math.max(150, maxLineLength * 8 + 20);
        const newHeight = Math.max(80, lines.length * 20 + 20);
        return {
          id: cls.id,
          offsetX: cls.position?.x || 200,
          offsetY: cls.position?.y || 150,
          width: newWidth,
          height: newHeight,
          annotations: [{ content }],
          style: { fill: '#fff', strokeColor: '#000', strokeWidth: 2 },
          constraints: NodeConstraints.Default | NodeConstraints.Drag
        };
      });
      
      // Verificar después de un tiempo que los IDs se mantengan en el diagrama
      setTimeout(() => {
        if (this.diagramComponent) {
          const diagramNodes = this.diagramComponent.nodes;
        }
      }, 500);
      
    }
    // Poblar relaciones
    if (snap.relations) {
      this.umlRelations = snap.relations;
      this.connectors = this.umlRelations.map(rel => {
          let connector: ConnectorModel = {
            id: rel.id,
            sourceID: rel.sourceId,
            targetID: rel.targetId,
            type: 'Orthogonal',
            style: { strokeColor: '#222', strokeWidth: 2 },
            targetDecorator: { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } }
          };
          switch (rel.type) {
            case 'Herencia':
              connector.targetDecorator = { shape: 'Arrow', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Asociación':
              connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Agregación':
              connector.targetDecorator = { shape: 'Diamond', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Composición':
              connector.targetDecorator = { shape: 'Diamond', style: { fill: '#222', strokeColor: '#222', strokeWidth: 2 } };
              connector.style = { strokeColor: '#222', strokeWidth: 2 };
              break;
            case 'Dependencia':
              connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
              connector.style = { strokeColor: '#222', strokeWidth: 2, strokeDashArray: '4 2' };
              break;
          }
          return connector;
        });
      
      // Agregar conectores visuales para relaciones N a N con clase de asociación
      this.umlRelations.forEach(rel => {
        if (rel.associationClassId) {
          const sourceClass = this.umlClasses.find(c => c.id === rel.sourceId);
          const targetClass = this.umlClasses.find(c => c.id === rel.targetId);
          const assocClass = this.umlClasses.find(c => c.id === rel.associationClassId);
          
          if (sourceClass && targetClass && assocClass) {
            const midPointX = (sourceClass.position.x + targetClass.position.x) / 2;
            const midPointY = (sourceClass.position.y + targetClass.position.y) / 2;
            
            const visualConnector: ConnectorModel = {
              id: 'assoc_line_' + rel.id + '_' + rel.associationClassId,
              targetID: rel.associationClassId,
              type: 'Straight',
              annotations: [{ content: '' }],
              style: { strokeColor: '#000', strokeWidth: 2, strokeDashArray: '3 3' },
              sourcePoint: { x: midPointX, y: midPointY },
              targetPoint: { x: assocClass.position.x, y: assocClass.position.y }
            };
            this.connectors.push(visualConnector);
          }
        }
      });
      
    }
    // Forzar refresco visual e inicializar monitoreo
    setTimeout(() => {
      if (this.diagramComponent) {
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
        
        // Inicializar sistema de monitoreo de posiciones después del refresco
        setTimeout(() => {
          this.updateKnownPositions();
          this.startPositionMonitoring();
        }, 200);
      }
    }, 100);
  }

  addNewClass(): void {
    const newClassId = `class_${Date.now()}`;
    const newClass: UMLClass = {
      id: newClassId,
      name: 'Nueva Clase',
      visibility: 'PUBLIC',
      position: { x: Math.random() * 400 + 300, y: Math.random() * 300 + 200 },
      size: { w: 150, h: 80 },
      attributes: []
    };
    this.umlClasses.push(newClass);
    // Formatear contenido UML: nombre, línea, atributos (vacío al crear)
    let content = newClass.name;
    if (newClass.attributes && newClass.attributes.length > 0) {
      content += '\n' + '─'.repeat(Math.max(newClass.name.length, 10)) + '\n';
      content += newClass.attributes.map(attr => {
        let line = attr.name + ': ' + attr.typeName;
        if (attr.isPrimaryKey) line += ' [PK]';
        return line;
      }).join('\n');
    }
    const lines = content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const newWidth = Math.max(150, maxLineLength * 8 + 20);
    const newHeight = Math.max(80, lines.length * 20 + 20);
    const newNode: NodeModel = {
      id: newClassId,
      offsetX: newClass.position.x,
      offsetY: newClass.position.y,
      width: newWidth,
      height: newHeight,
      annotations: [{ content }],
      style: { fill: '#ffffff', strokeColor: '#000000', strokeWidth: 2 },
      constraints: NodeConstraints.Default | NodeConstraints.Drag
    };
    this.nodes.push(newNode);
    if (this.diagramComponent) {
      this.diagramComponent.addNode(newNode);
      this.diagramComponent.clearSelection();
      this.diagramComponent.dataBind();
      this.diagramComponent.refresh();
      
      // Agregar nueva posición al monitoreo
      this.lastKnownPositions.set(newClassId, { 
        x: newClass.position.x, 
        y: newClass.position.y 
      });
    }
    // Auto-guardar cambios localmente
    this.autoSaveDiagram();
    
    // Actualizar snapshot para sugerencias de IA
    this.updateSnapshotForAI();
    
    // Emitir evento colaborativo
    if (this.collabComp && this.collabComp.sendEvent) {
      this.collabComp.sendEvent({
        type: 'add_class',
        diagramId: this.diagramId,
        payload: { class: newClass }
      });
    }
  }

  onRelationSelected(relationType: string): void {
    this.selectedRelationType = relationType;
    // Al seleccionar una relación, resetea selección de nodos
    this.selectedSourceNodeId = null;
    this.selectedTargetNodeId = null;
  }


  // Manejar clic en nodo del diagrama (evento de Syncfusion)
  onNodeClick(event: any): void {
    if (event && event.element && event.element.id) {
      const nodeId = event.element.id;
      if (!this.selectedRelationType) return;
      if (!this.selectedSourceNodeId) {
        this.selectedSourceNodeId = nodeId;
        return;
      }
      if (!this.selectedTargetNodeId && nodeId !== this.selectedSourceNodeId) {
        this.selectedTargetNodeId = nodeId;
        this.createRelationConnector();
      }
    }
  }

  // Crear el conector visual según el tipo de relación UML
  createRelationConnector(): void {
    if (!this.selectedSourceNodeId || !this.selectedTargetNodeId || !this.selectedRelationType) {
      return;
    }
    const connectorId = `rel_${this.selectedRelationType}_${Date.now()}`;

    let connector: ConnectorModel = {
      id: connectorId,
      sourceID: this.selectedSourceNodeId,
      targetID: this.selectedTargetNodeId,
      type: 'Orthogonal',
      style: { strokeColor: '#222', strokeWidth: 2 },
      targetDecorator: { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } }
    };

    // Personalizar aspecto visual y guardar relación estructurada
    let relationType = this.selectedRelationType as UMLRelation['type'];
    switch (relationType) {
      case 'Herencia':
        connector.targetDecorator = { shape: 'Arrow', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Asociación':
        connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Agregación':
        connector.targetDecorator = { shape: 'Diamond', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Composición':
        connector.targetDecorator = { shape: 'Diamond', style: { fill: '#222', strokeColor: '#222', strokeWidth: 2 } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Dependencia':
        connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
        connector.style = { strokeColor: '#222', strokeWidth: 2, strokeDashArray: '4 2' };
        break;
    }

    // Guardar la relación en ambos arrays
    this.umlRelations.push({
      id: connectorId,
      sourceId: this.selectedSourceNodeId!,
      targetId: this.selectedTargetNodeId!,
      type: relationType
    });
    this.connectors.push(connector);
    if (this.diagramComponent) {
      this.diagramComponent.addConnector(connector);
      this.diagramComponent.clearSelection();
      this.diagramComponent.dataBind();
      this.diagramComponent.refresh();
    }
    
    // Auto-guardar cambios localmente
    this.autoSaveDiagram();
    
    // Emitir evento colaborativo de agregar relación
    if (this.collabComp && this.collabComp.sendEvent) {
      this.collabComp.sendEvent({
        type: 'add_relation',
        diagramId: this.diagramId,
        payload: {
          relation: {
            id: connectorId,
            sourceId: this.selectedSourceNodeId!,
            targetId: this.selectedTargetNodeId!,
            type: relationType
          }
        }
      });
    }
    
    // Reset selección
    this.selectedSourceNodeId = null;
    this.selectedTargetNodeId = null;
    this.selectedRelationType = '';
  }

  // Eliminar clase (opcional, si tienes esta función)
  deleteClass(classId: string) {
    this.umlClasses = this.umlClasses.filter(cls => cls.id !== classId);
    this.nodes = this.nodes.filter(n => n.id !== classId);
    // Eliminar relaciones asociadas
    this.umlRelations = this.umlRelations.filter(rel => rel.sourceId !== classId && rel.targetId !== classId);
    this.connectors = this.connectors.filter(c => c.sourceID !== classId && c.targetID !== classId);
    if (this.diagramComponent) {
      const node = this.diagramComponent.getNodeObject(classId);
      if (node) {
        this.diagramComponent.remove(node);
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
      }
    }
    
    // Auto-guardar cambios localmente
    this.autoSaveDiagram();
    
    // Emitir evento colaborativo de eliminar clase
    if (this.collabComp && this.collabComp.sendEvent) {
      this.collabComp.sendEvent({
        type: 'delete_class',
        diagramId: this.diagramId,
        payload: { classId: classId }
      });
    }
  }

  // Eliminar relación seleccionada (ya implementado, pero asegúrate de esto)
  deleteSelectedRelation() {
    if (!this.selectedUMLRelationId) return;
    
    
    const relationToDelete = this.selectedUMLRelationId;
    
    this.umlRelations = this.umlRelations.filter(rel => rel.id !== relationToDelete);
    this.connectors = this.connectors.filter(c => c.id !== relationToDelete);
    
    if (this.diagramComponent) {
      const connector = this.diagramComponent.getConnectorObject(relationToDelete);
      if (connector) {
        this.diagramComponent.remove(connector);
        
        // Actualizar referencias de arrays para sincronización
        this.diagramComponent.connectors = [...this.connectors];
        
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
      } else {
      }
    }
    
    // Auto-guardar cambios localmente
    this.autoSaveDiagram();
    
    // Emitir evento colaborativo de eliminar relación
    if (this.collabComp && this.collabComp.sendEvent) {
      this.collabComp.sendEvent({
        type: 'delete_relation',
        diagramId: this.diagramId,
        payload: { relationId: relationToDelete }
      });
    } else {
    }
    
    this.selectedUMLRelationId = null;
  }

  // Eliminar clase seleccionada con sincronización colaborativa
  deleteSelectedClass() {
    if (!this.selectedUMLClass) {
      return;
    }
    
    const classToDelete = this.selectedUMLClass.id;
    
    try {
      // 1. Eliminar relaciones que usan esta clase
      const relationsToDelete = this.umlRelations.filter(
        rel => rel.sourceId === classToDelete || rel.targetId === classToDelete
      );
      
      relationsToDelete.forEach(rel => {

        // Eliminar de arrays locales
        this.umlRelations = this.umlRelations.filter(r => r.id !== rel.id);
        this.connectors = this.connectors.filter(c => c.id !== rel.id);
        
        // Eliminar del diagrama visual
        if (this.diagramComponent) {
          const connector = this.diagramComponent.getConnectorObject(rel.id);
          if (connector) {
            this.diagramComponent.remove(connector);
          }
        }
      });
      
      // 2. Eliminar la clase del array UML
      const classIndex = this.umlClasses.findIndex(c => c.id === classToDelete);
      if (classIndex !== -1) {
        this.umlClasses.splice(classIndex, 1);
      }
      
      // 3. Eliminar nodo visual
      const nodeIndex = this.nodes.findIndex(n => n.id === classToDelete);
      if (nodeIndex !== -1) {
        this.nodes.splice(nodeIndex, 1);
      }
      
      // 4. Eliminar del diagrama visual
      if (this.diagramComponent) {
        const nodeObj = this.diagramComponent.getNodeObject(classToDelete);
        if (nodeObj) {
          this.diagramComponent.remove(nodeObj);
        }
        
        // Actualizar referencias de arrays para sincronización
        this.diagramComponent.nodes = [...this.nodes];
        this.diagramComponent.connectors = [...this.connectors];
        
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
      }
      
      // 5. Auto-guardar cambios localmente
      this.autoSaveDiagram();
      
      // 6. Emitir evento colaborativo
      if (this.collabComp && this.collabComp.sendEvent) {
        this.collabComp.sendEvent({
          type: 'delete_class',
          diagramId: this.diagramId,
          payload: { classId: classToDelete }
        });
      } else {
      }
      
      // 7. Limpiar selección
      this.selectedUMLClass = null;
      
    } catch (error) {
    }
  }

  // Devuelve la clase UML real asociada a un nodo del diagrama
  getUMLClassByNodeId(nodeId: string): UMLClass | null {
  return this.umlClasses.find((c: UMLClass) => c.id === nodeId) || null;
  }

  // Actualiza el contenido visual del nodo en el canvas
  updateNodeContent(umlClass: UMLClass | null) {
    if (!umlClass) return;
    
    
    // Construir contenido con formato UML: nombre arriba, línea separadora, atributos abajo
    let content = umlClass.name;
    
    if (umlClass.attributes.length > 0) {
      content += '\n' + '─'.repeat(Math.max(umlClass.name.length, 10)) + '\n'; // Línea separadora
      content += umlClass.attributes.map(attr => {
        let line = attr.name + ': ' + attr.typeName;
        if (attr.isPrimaryKey) line += ' [PK]';
        return line;
      }).join('\n');
    }
    
    // Método más directo: eliminar y recrear el nodo
    if (this.diagramComponent) {
      // Obtener información del nodo actual
      const currentNode = this.diagramComponent.getNodeObject(umlClass.id);
      if (currentNode) {
        const currentX = currentNode.offsetX;
        const currentY = currentNode.offsetY;
        
        // Eliminar el nodo actual
        this.diagramComponent.remove(currentNode);
        
        // Calcular nuevo tamaño
        const lines = content.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        const newWidth = Math.max(150, maxLineLength * 8 + 20);
        const newHeight = Math.max(80, lines.length * 20 + 20);
        
        // Crear nodo nuevo con el contenido actualizado
        const updatedNode: NodeModel = {
          id: umlClass.id,
          offsetX: currentX,
          offsetY: currentY,
          width: newWidth,
          height: newHeight,
          annotations: [{ 
            content: content
          }],
          style: { 
            fill: '#ffffff', 
            strokeColor: '#000000', 
            strokeWidth: 2 
          }
        };
        
        // Agregar el nodo actualizado
        this.diagramComponent.add(updatedNode);
        
        // Actualizar referencias de arrays para sincronización
        this.diagramComponent.nodes = [...this.diagramComponent.nodes];
        if (this.diagramComponent.connectors) {
          this.diagramComponent.connectors = [...this.connectors];
        }
        
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
        
      }
    }
  }

    // --- Estado y métodos para edición de relaciones ---
  editingRelation: UMLRelation | null = null;
  showRelationSidebar: boolean = false;
  relationMultiplicities = ['1', '0..1', '*', '1..*'];

  // Abrir panel lateral para editar relación
  openRelationPanel(relationId: string) {
    const rel = this.umlRelations.find(r => r.id === relationId);
    if (rel) {
      // Clonar para edición sin afectar el original hasta guardar
      this.editingRelation = { ...rel };
      this.showRelationSidebar = true;
    }
  }

  // Cerrar panel lateral
  closeRelationPanel() {
    this.editingRelation = null;
    this.showRelationSidebar = false;
  }

  // Guardar cambios en la relación editada
  saveRelationEdit() {
    if (!this.editingRelation) return;
    const idx = this.umlRelations.findIndex(r => r.id === this.editingRelation!.id);
    if (idx !== -1) {
      // Detectar N a N por multiplicidad y crear clase intermedia si corresponde
      const isNtoN = (this.editingRelation.type === 'Asociación' || this.editingRelation.type === 'AsociaciónNtoN') &&
        ((this.editingRelation.sourceMultiplicity === '*' || this.editingRelation.sourceMultiplicity === '1..*') &&
         (this.editingRelation.targetMultiplicity === '*' || this.editingRelation.targetMultiplicity === '1..*'));
      if (isNtoN && !this.editingRelation.associationClassId) {
        // Cambiar tipo internamente para consistencia
        this.editingRelation.type = 'AsociaciónNtoN';
        const assocClassId = this.createAssociationClassForNtoN(this.editingRelation);
        this.editingRelation.associationClassId = assocClassId;
      }
      this.umlRelations[idx] = { ...this.editingRelation };
    }
    this.closeRelationPanel();
  }

  // Crear clase intermedia para NtoN
  createAssociationClassForNtoN(relation: UMLRelation): string {
    // Buscar las clases padres
    const source = this.umlClasses.find(c => c.id === relation.sourceId);
    const target = this.umlClasses.find(c => c.id === relation.targetId);
    if (!source || !target) return '';
    // Crear clase intermedia
    const assocClassId = `assoc_${source.id}_${target.id}_${Date.now()}`;
    const assocClassName = relation.name || `${source.name}_${target.name}`;
    const assocClass: UMLClass = {
      id: assocClassId,
      name: assocClassName,
      visibility: 'PUBLIC',
      position: { x: (source.position.x + target.position.x) / 2, y: (source.position.y + target.position.y) / 2 + 100 },
      size: { w: 180, h: 80 },
      attributes: [
        {
          id: 'A' + Date.now() + '_src',
          name: source.name.toLowerCase() + 'Id',
          typeName: 'long',
          isRequired: true,
          isPrimaryKey: true,
          position: 0
        },
        {
          id: 'A' + Date.now() + '_tgt',
          name: target.name.toLowerCase() + 'Id',
          typeName: 'long',
          isRequired: true,
          isPrimaryKey: true,
          position: 1
        }
      ]
    };
    this.umlClasses.push(assocClass);
    // Agregar nodo visual
    let content = assocClass.name;
    if (assocClass.attributes.length > 0) {
      content += '\n' + '─'.repeat(Math.max(assocClass.name.length, 10)) + '\n';
      content += assocClass.attributes.map(attr => {
        let line = attr.name + ': ' + attr.typeName;
        if (attr.isPrimaryKey) line += ' [PK]';
        return line;
      }).join('\n');
    }
    const lines = content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const newWidth = Math.max(150, maxLineLength * 8 + 20);
    const newHeight = Math.max(80, lines.length * 20 + 20);
    const newNode: NodeModel = {
      id: assocClassId,
      offsetX: assocClass.position.x,
      offsetY: assocClass.position.y,
      width: newWidth,
      height: newHeight,
      annotations: [{ content }],
      style: { fill: '#ffffff', strokeColor: '#000000', strokeWidth: 2 },
      constraints: NodeConstraints.Default | NodeConstraints.Drag
    };
    this.nodes.push(newNode);
    if (this.diagramComponent) {
      this.diagramComponent.addNode(newNode);
      this.diagramComponent.dataBind();
      this.diagramComponent.refresh();
    }

    // Crear solo un conector visual desde el punto medio de la relación hacia la clase intermedia
    const midPointX = (source.position.x + target.position.x) / 2;
    const midPointY = (source.position.y + target.position.y) / 2;
    
    const connectorToAssocClass: ConnectorModel = {
      id: 'assoc_line_' + relation.id + '_' + assocClassId,
      targetID: assocClassId,
      type: 'Straight',
      annotations: [{ content: '' }],
      style: { strokeColor: '#000', strokeWidth: 2, strokeDashArray: '3 3' },
      sourcePoint: { x: midPointX, y: midPointY },
      targetPoint: { x: assocClass.position.x, y: assocClass.position.y }
    };
    this.connectors.push(connectorToAssocClass);
    if (this.diagramComponent) {
      this.diagramComponent.add(connectorToAssocClass);
      this.diagramComponent.dataBind();
      this.diagramComponent.refresh();
    }
    return assocClassId;
  }

  // === MÉTODOS PARA SUGERENCIAS DE IA ===

  /**
   * Toggle del panel de sugerencias de IA
   */
  toggleAISuggestions(): void {
    this.showAISuggestions = !this.showAISuggestions;
    if (this.showAISuggestions) {
      this.updateSnapshotForAI();
    }
  }

  /**
   * Toggle del panel de comandos de voz
   */
  toggleVoicePrompt(): void {
    this.showVoicePrompt = !this.showVoicePrompt;
    if (this.showVoicePrompt) {
      this.updateSnapshotForAI();
    }
  }

  /**
   * Actualiza el snapshot actual para enviar a la IA
   */
  updateSnapshotForAI(): void {
    this.syncDataFromVisuals();
    this.currentSnapshot = {
      classes: this.umlClasses.map(cls => ({
        id: cls.id,
        name: cls.name,
        visibility: cls.visibility,
        attributes: cls.attributes.map(attr => ({
          name: attr.name,
          typeName: attr.typeName,
          isRequired: attr.isRequired,
          isPrimaryKey: attr.isPrimaryKey
        }))
      })),
      relations: this.umlRelations.map(rel => ({
        id: rel.id,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        type: rel.type,
        sourceMultiplicity: rel.sourceMultiplicity,
        targetMultiplicity: rel.targetMultiplicity,
        name: rel.name
      }))
    };
  }

  /**
   * Aplica una sugerencia individual de la IA
   */
  onApplySuggestion(suggestion: UMLSuggestion): void {
    try {
      if (suggestion.implementation) {
        let classModified = false;
        
        // Aplicar atributo sugerido
        if (suggestion.implementation.attributeToAdd) {
          this.applyAttributeSuggestion(suggestion.target, suggestion.implementation.attributeToAdd);
          classModified = true;
        }

        // Modificar atributo existente
        if (suggestion.implementation.attributeToModify) {
          this.applyAttributeModification(suggestion.target, suggestion.implementation.attributeToModify);
          classModified = true;
        }

        // Si se modificó una clase, usar el método unificado (replica botón "Actualizar clase")
        if (classModified) {
          this.updateAndSyncClass(suggestion.target);
        }

        // Aplicar relación sugerida
        if (suggestion.implementation.relationToAdd) {
          const relationId = this.applyRelationSuggestion(suggestion.implementation.relationToAdd);
          // Emitir evento colaborativo para nueva relación
          if (relationId) {
            this.emitRelationAddEvent(relationId);
          }
        }

        // Solo actualizar canvas para relaciones (las clases ya se actualizaron individualmente)
        if (suggestion.implementation.relationToAdd) {
          this.refreshCanvas();
        }

        // Autoguardar después de aplicar la sugerencia
        this.autoSaveDiagram();

      }
    } catch (error) {
    }
  }

  /**
   * Aplica todas las sugerencias de la IA
   */
  onApplyAllSuggestions(response: UMLSuggestionsResponse): void {
    let appliedCount = 0;
    const modifiedClasses = new Set<string>();
    const addedRelations: string[] = [];
    
    response.suggestions.forEach(suggestion => {
      try {
        if (suggestion.implementation) {
          if (suggestion.implementation.attributeToAdd) {
            this.applyAttributeSuggestion(suggestion.target, suggestion.implementation.attributeToAdd);
            modifiedClasses.add(suggestion.target);
            appliedCount++;
          }
          if (suggestion.implementation.attributeToModify) {
            this.applyAttributeModification(suggestion.target, suggestion.implementation.attributeToModify);
            modifiedClasses.add(suggestion.target);
            appliedCount++;
          }
          if (suggestion.implementation.relationToAdd) {
            const relationId = this.applyRelationSuggestion(suggestion.implementation.relationToAdd);
            if (relationId) {
              addedRelations.push(relationId);
            }
            appliedCount++;
          }
        }
      } catch (error) {
      }
    });

    // Actualizar y sincronizar todas las clases modificadas (replica botón "Actualizar clase")
    modifiedClasses.forEach(classId => {
      this.updateAndSyncClass(classId);
    });
    
    // Emitir eventos colaborativos para todas las relaciones añadidas
    addedRelations.forEach(relationId => {
      this.emitRelationAddEvent(relationId);
    });
    
    // Solo actualizar canvas para relaciones (las clases ya se actualizaron individualmente)
    if (addedRelations.length > 0) {
      this.refreshCanvas();
    }
    
    this.updateSnapshotForAI();
    
    // Autoguardar después de aplicar todas las sugerencias
    this.autoSaveDiagram();
    
  }

  // Método para manejar los cambios aplicados desde comandos de voz
  onApplyVoiceChanges(response: UMLSuggestionsResponse): void {

    let appliedCount = 0;
    const modifiedClasses = new Set<string>();
    const addedRelations: string[] = [];
    const idMapping = new Map<string, string>(); // Mapeo de IDs de IA a IDs reales
    
    // PASO 1: Crear primero todas las clases nuevas y generar mapeo de IDs
    response.suggestions.forEach(suggestion => {
      try {
        if (suggestion.implementation?.classToAdd) {
          const originalId = suggestion.implementation.classToAdd.id;
          const realId = this.applyClassSuggestionWithMapping(suggestion.implementation.classToAdd);
          if (realId) {
            idMapping.set(originalId, realId);
            appliedCount++;
          }
        }
      } catch (error) {
      }
    });

    // PASO 2: Aplicar atributos y modificaciones a clases existentes
    response.suggestions.forEach(suggestion => {
      try {
        if (suggestion.implementation) {
          // Aplicar atributos
          if (suggestion.implementation.attributeToAdd) {
            // Mapear el target si es necesario
            const targetId = idMapping.get(suggestion.target) || suggestion.target;
            this.applyAttributeSuggestion(targetId, suggestion.implementation.attributeToAdd);
            modifiedClasses.add(targetId);
            appliedCount++;
          }
          
          // Modificar atributos existentes
          if (suggestion.implementation.attributeToModify) {
            const targetId = idMapping.get(suggestion.target) || suggestion.target;
            this.applyAttributeModification(targetId, suggestion.implementation.attributeToModify);
            modifiedClasses.add(targetId);
            appliedCount++;
          }
        }
      } catch (error) {
      }
    });

    // PASO 3: Aplicar relaciones (con IDs ya mapeados)
    response.suggestions.forEach(suggestion => {
      try {
        if (suggestion.implementation?.relationToAdd) {
          // Mapear los IDs de source y target
          const relationData = { ...suggestion.implementation.relationToAdd };
          relationData.sourceId = idMapping.get(relationData.sourceId) || relationData.sourceId;
          relationData.targetId = idMapping.get(relationData.targetId) || relationData.targetId;
          
          const relationId = this.applyRelationSuggestion(relationData);
          if (relationId) {
            addedRelations.push(relationId);
            appliedCount++;
          }
        }
      } catch (error) {
      }
    });

    // Actualizar y sincronizar todas las clases modificadas
    modifiedClasses.forEach(classId => {
      this.updateAndSyncClass(classId);
    });
    
    // Emitir eventos colaborativos para todas las relaciones añadidas
    addedRelations.forEach(relationId => {
      this.emitRelationAddEvent(relationId);
    });
    
    // Actualizar canvas para relaciones
    if (addedRelations.length > 0) {
      this.refreshCanvas();
    }
    
    this.updateSnapshotForAI();
    
    // Autoguardar después de aplicar cambios de voz
    this.autoSaveDiagram();
    
  }

  /**
   * Aplica un atributo sugerido a una clase
   */
  private applyAttributeSuggestion(classId: string, attributeData: any): void {
    const targetClass = this.umlClasses.find(cls => cls.id === classId);
    if (!targetClass) {
      return;
    }

    // Manejar tanto arrays como objetos individuales
    const attributesToAdd = Array.isArray(attributeData) ? attributeData : [attributeData];
    
    attributesToAdd.forEach(attrData => {
      // Verificar que el atributo no exista ya
      const existingAttr = targetClass.attributes.find(attr => attr.name === attrData.name);
      if (existingAttr) {
        return;
      }

      // Si el nuevo atributo es PK, remover PK de otros atributos
      if (attrData.isPrimaryKey) {
        targetClass.attributes.forEach(attr => {
          if (attr.isPrimaryKey) {
            attr.isPrimaryKey = false;
          }
        });
      }

      // Crear nuevo atributo
      const newAttribute: UMLAttribute = {
        id: `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: attrData.name,
        typeName: attrData.typeName || 'string',
        isRequired: attrData.isRequired || false,
        isPrimaryKey: attrData.isPrimaryKey || false,
        position: targetClass.attributes.length
      };

      targetClass.attributes.push(newAttribute);
    });
  }

  /**
   * Modifica un atributo existente según la sugerencia
   */
  private applyAttributeModification(classId: string, modificationData: any): void {
    const targetClass = this.umlClasses.find(cls => cls.id === classId);
    if (!targetClass) {
      return;
    }

    const targetAttribute = targetClass.attributes.find(attr => attr.name === modificationData.name);
    if (!targetAttribute) {
      return;
    }

    // Aplicar la modificación según el tipo de propiedad
    const propertyName = modificationData.propertyName;
    const newValue = modificationData.newValue;

    if (propertyName in targetAttribute) {
      (targetAttribute as any)[propertyName] = newValue;
    } else {
    }
  }

  /**
   * Aplica una relación sugerida
   */
  private applyRelationSuggestion(relationData: any): string | null {
    // Verificar que las clases existan
    const sourceClass = this.umlClasses.find(cls => cls.id === relationData.sourceId);
    const targetClass = this.umlClasses.find(cls => cls.id === relationData.targetId);
    
    if (!sourceClass || !targetClass) {
      return null;
    }

    // Verificar que la relación no exista ya
    const existingRelation = this.umlRelations.find(rel => 
      rel.sourceId === relationData.sourceId && 
      rel.targetId === relationData.targetId &&
      rel.type === relationData.type
    );
    
    if (existingRelation) {
      return null;
    }

    // Crear nueva relación
    const newRelation: UMLRelation = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceId: relationData.sourceId,
      targetId: relationData.targetId,
      type: relationData.type || 'Asociación',
      sourceMultiplicity: relationData.sourceMultiplicity || '1',
      targetMultiplicity: relationData.targetMultiplicity || '1',
      name: relationData.name || ''
    };

    this.umlRelations.push(newRelation);
    return newRelation.id;
  }

  /**
   * Aplica una clase sugerida desde comandos de voz y retorna el ID real generado
   */
  private applyClassSuggestionWithMapping(classData: any): string | null {
    // Verificar que la clase no exista ya
    const existingClass = this.umlClasses.find(cls => cls.name.toLowerCase() === classData.name.toLowerCase());
    
    if (existingClass) {
      return existingClass.id; // Retornar ID existente
    }

    // Generar ID único
    const realId = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear nueva clase
    const newClass: UMLClass = {
      id: realId,
      name: classData.name,
      visibility: classData.visibility || 'PUBLIC',
      position: classData.position || { x: 100 + (this.umlClasses.length * 50), y: 100 + (this.umlClasses.length * 50) },
      size: { w: 200, h: 150 },
      attributes: classData.attributes || []
    };

    // Agregar la clase
    this.umlClasses.push(newClass);
    
    // Crear contenido visual
    let content = newClass.name;
    if (newClass.attributes && newClass.attributes.length > 0) {
      content += '\n' + '─'.repeat(Math.max(newClass.name.length, 10)) + '\n';
      content += newClass.attributes.map((attr: any) => {
        let line = attr.name + ': ' + attr.typeName;
        if (attr.isPrimaryKey) line += ' [PK]';
        return line;
      }).join('\n');
    }
    
    const lines = content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const calculatedWidth = Math.max(150, maxLineLength * 8 + 20);
    const calculatedHeight = Math.max(80, lines.length * 20 + 20);
    
    newClass.size.w = calculatedWidth;
    newClass.size.h = calculatedHeight;

    // Crear nodo visual
    const newNode: NodeModel = {
      id: newClass.id,
      offsetX: newClass.position.x,
      offsetY: newClass.position.y,
      width: newClass.size.w,
      height: newClass.size.h,
      annotations: [{
        content: content,
        style: { fontSize: 12, color: 'black', textAlign: 'Left', textWrapping: 'Wrap' }
      }],
      style: {
        fill: '#E1F5FE',
        strokeColor: '#0277BD',
        strokeWidth: 2
      },
      constraints: NodeConstraints.Default | NodeConstraints.AllowDrop
    };

    // Agregar al diagrama
    this.diagramComponent.add(newNode);
    
    // Emitir evento colaborativo
    if (this.collabComp && this.collabComp.sendEvent) {
      this.collabComp.sendEvent({
        type: 'add_class',
        diagramId: this.diagramId,
        payload: { class: newClass }
      });
    }
    
    // Autoguardar después de crear la clase
    this.autoSaveDiagram();
    
    return realId;
  }

  /**
   * Aplica una clase sugerida desde comandos de voz (método de compatibilidad)
   */
  private applyClassSuggestion(classData: any): void {
    this.applyClassSuggestionWithMapping(classData);
  }

  /**
   * Actualiza el canvas después de aplicar sugerencias
   */
  private refreshCanvas(): void {
    // Actualizar nodos existentes
    this.umlClasses.forEach(umlClass => {
      this.updateNodeContent(umlClass);
    });

    // Crear conectores para nuevas relaciones
    this.umlRelations.forEach(relation => {
      const existingConnector = this.connectors.find(conn => conn.id === `connector_${relation.id}`);
      if (!existingConnector) {
        this.createVisualConnector(relation);
      }
    });

    // Refrescar el diagrama
    if (this.diagramComponent) {
      this.diagramComponent.dataBind();
      this.diagramComponent.refresh();
    }
  }

  /**
   * Crea un conector visual para una relación UML
   */
  private createVisualConnector(relation: UMLRelation): void {
    let connector: ConnectorModel = {
      id: relation.id,
      sourceID: relation.sourceId,
      targetID: relation.targetId,
      type: 'Orthogonal',
      style: { strokeColor: '#222', strokeWidth: 2 },
      targetDecorator: { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } }
    };

    // Aplicar estilos específicos según el tipo de relación UML
    switch (relation.type) {
      case 'Herencia':
        connector.targetDecorator = { shape: 'Arrow', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Asociación':
        connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Agregación':
        connector.targetDecorator = { shape: 'Diamond', style: { fill: '#fff', strokeColor: '#222', strokeWidth: 2 } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Composición':
        connector.targetDecorator = { shape: 'Diamond', style: { fill: '#222', strokeColor: '#222', strokeWidth: 2 } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
      case 'Dependencia':
        connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
        connector.style = { strokeColor: '#222', strokeWidth: 2, strokeDashArray: '4 2' };
        break;
      case 'AsociaciónNtoN':
        connector.targetDecorator = { shape: 'Arrow', style: { fill: '#222', strokeColor: '#222' } };
        connector.style = { strokeColor: '#222', strokeWidth: 2 };
        break;
    }

    // Agregar multiplicidades si existen
    if (relation.sourceMultiplicity || relation.targetMultiplicity) {
      connector.annotations = [];
      if (relation.sourceMultiplicity) {
        connector.annotations.push({
          content: relation.sourceMultiplicity,
          alignment: 'Before',
          displacement: { x: 0, y: -10 }
        });
      }
      if (relation.targetMultiplicity) {
        connector.annotations.push({
          content: relation.targetMultiplicity,
          alignment: 'After',
          displacement: { x: 0, y: -10 }
        });
      }
    }

    this.connectors.push(connector);
    
    if (this.diagramComponent) {
      this.diagramComponent.add(connector);
    }

  }

  /**
   * Actualiza y sincroniza una clase específica por ID (replica la lógica del botón "Actualizar clase")
   * Este método debe usarse tanto para cambios manuales como para sugerencias de IA
   */
  private updateAndSyncClass(classId: string): void {
    
    const classToUpdate = this.umlClasses.find(cls => cls.id === classId);
    if (!classToUpdate) {
      return;
    }
    
    
    // 1. Actualizar contenido visual del nodo (igual que el botón manual)
    this.updateNodeContent(classToUpdate);
    
    // 2. Auto-guardar cambios localmente (igual que el botón manual)
    this.autoSaveDiagram();
    
    // 3. Emitir evento colaborativo con el formato correcto (igual que el botón manual)
    if (!this.collabComp || !this.diagramId) {
      return;
    }
    
    const eventData: DiagramCollabEvent = {
      type: 'update_class' as const,
      diagramId: this.diagramId,
      payload: {
        classId: classToUpdate.id,
        changes: { ...classToUpdate }
      }
    };
    
    try {
      this.collabComp.sendEvent(eventData);
    } catch (error) {
    }
    
    // 4. Actualizar snapshot para sugerencias de IA
    this.updateSnapshotForAI();
    
  }

  /**
   * Emite un evento colaborativo cuando se actualiza una clase via sugerencias IA
   * @deprecated Usar updateAndSyncClass() en su lugar para consistencia
   */
  private emitClassUpdateEvent(classId: string): void {
    // Redirigir al método unificado
    this.updateAndSyncClass(classId);
  }

  /**
   * Emite un evento colaborativo cuando se añade una relación via sugerencias IA
   */
  private emitRelationAddEvent(relationId: string): void {
    const addedRelation = this.umlRelations.find(rel => rel.id === relationId);
    if (!addedRelation) {
      return;
    }

    if (this.collabComp && this.collabComp.sendEvent) {
      try {
        this.collabComp.sendEvent({
          type: 'add_relation',
          diagramId: this.diagramId,
          payload: { relation: addedRelation }
        });
        
        // Autoguardar después de emitir evento de relación
        this.autoSaveDiagram();
        
      } catch (error) {
      }
    } else {
      
      // Autoguardar incluso si no hay colaboración
      this.autoSaveDiagram();
    }
  }

  /**
   * Notifica al componente de sugerencias IA sobre cambios externos (otros usuarios)
   */
  private notifyAISuggestionsOfExternalChange(message: string): void {
    // Actualizar snapshot primero
    this.updateSnapshotForAI();
    
    // Mostrar feedback visual temporal si el componente de sugerencias está disponible
    if (this.aiSuggestionsComp && this.showAISuggestions) {
      try {
        this.aiSuggestionsComp.showSuccessFeedback('👥 ' + message);
        // Refrescar sugerencias después de un pequeño delay para permitir que el UI se actualice
        setTimeout(() => {
          if (this.aiSuggestionsComp) {
            this.aiSuggestionsComp.refreshSuggestions();
          }
        }, 1000);
      } catch (error) {
      }
    }
  }

  ngAfterViewInit(): void {
    // Verificar que el componente de colaboración esté disponible

    
    if (this.collabComp) {
      
      // Verificar conexión después de un breve delay
      setTimeout(() => {
      }, 2000);
    } else {
      
      // Verificar nuevamente después de un delay por si el componente se inicializa tarde
      setTimeout(() => {
        if (this.collabComp) {
        } else {
        }
      }, 2000);
    }
    
    // Agregar funciones de debugging global para consola del navegador
    (window as any).diagramDebug = {
      testMovement: () => {
        if (this.nodes.length > 0) {
          const testNode = this.nodes[0];
          
          // Simular evento de movimiento
          const fakeEvent = {
            element: {
              id: testNode.id,
              offsetX: (testNode.offsetX || 0) + 50,
              offsetY: (testNode.offsetY || 0) + 50
            }
          };
          
          this.onElementMoved(fakeEvent);
        } else {
        }
      },
      getState: () => {
        return {
          diagramId: this.diagramId,
          nodes: this.nodes.map(n => ({ id: n.id, x: n.offsetX, y: n.offsetY })),
          classes: this.umlClasses.map(c => ({ id: c.id, name: c.name, x: c.position.x, y: c.position.y })),
          collabCompAvailable: !!this.collabComp,
          diagramCompAvailable: !!this.diagramComponent
        };
      },
      forcePropertyChange: () => {
        if (this.diagramComponent && this.nodes.length > 0) {
          const testNode = this.nodes[0];
          // Intentar obtener el nodo del diagrama y modificar su posición
          const diagramNode = this.diagramComponent.getNodeObject(testNode.id!);
          if (diagramNode) {
            // Forzar un cambio pequeño
            diagramNode.offsetX = (diagramNode.offsetX || 0) + 1;
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
        }
      }
    };
    

  }

  ngOnDestroy(): void {
    // Limpiar timeout de auto-guardado
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
    
    // Detener monitoreo de posiciones
    this.stopPositionMonitoring();
  }

}