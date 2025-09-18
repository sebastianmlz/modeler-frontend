

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
import { DiagramCollabEvent } from '../diagram-collab-event.model';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramVersionService } from './diagram-version.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShowSidebarComponent } from './show-sidebar/show-sidebar.component';
import { DiagramModule, NodeModel, ConnectorModel, DiagramComponent, NodeConstraints } from '@syncfusion/ej2-angular-diagrams';
import { DiagramCollaborationComponent } from './diagram-collaboration/diagram-collaboration.component';

// ...existing code...

@Component({
  selector: 'app-diagram-show',
  standalone: true,
  imports: [CommonModule, FormsModule, ShowSidebarComponent, DiagramModule,DiagramCollaborationComponent],
  templateUrl: './diagram-show.component.html',
  styleUrl: './diagram-show.component.css'
})
export class DiagramShowComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('collabComp', { static: false }) collabComp!: DiagramCollaborationComponent;

  // Maneja cambios de estado de la colaboración (opcional: puedes mostrar estado en UI si lo deseas)
  onCollabStatus(status: 'disconnected' | 'connecting' | 'connected') {
    console.log('[Colaboración] Estado:', status);
  }
  // --- Métodos para colaboración en tiempo real ---
  // Maneja eventos recibidos desde el WebSocket de colaboración
  onCollabEvent(event: DiagramCollabEvent) {
    console.log('[COLABORACIÓN] 📥 EVENTO RECIBIDO EN COMPONENTE PRINCIPAL:', event);
    if (!event || !event.type) {
      console.error('[COLABORACIÓN] ❌ Evento inválido recibido:', event);
      return;
    }
    
    console.log('[COLABORACIÓN] 🔄 Procesando evento tipo:', event.type);
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
          console.log('[DEBUG] 🆕 CREANDO NODO con ID:', newNode.id);
          console.log('[DEBUG] 🆕 Nodo completo:', newNode);
          this.nodes.push(newNode);
          console.log('[DEBUG] 🆕 Nodos en array después de agregar:', this.nodes.map(n => ({ id: n.id, x: n.offsetX, y: n.offsetY })));
          if (this.diagramComponent) {
            this.diagramComponent.addNode(newNode);
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
            
            // Verificar el ID después de agregar
            setTimeout(() => {
              const addedNode = this.diagramComponent.getNodeObject(newNode.id!);
              console.log('[DEBUG] 🔍 Nodo después de agregar al diagrama:', addedNode);
              if (addedNode) {
                console.log('[DEBUG] ✅ ID mantenido:', addedNode.id);
              } else {
                console.warn('[DEBUG] ❌ Nodo no encontrado con ID original:', newNode.id);
                // Buscar todos los nodos en el diagrama
                const allNodes = this.diagramComponent.nodes;
                console.log('[DEBUG] 📋 Todos los nodos en diagrama:', allNodes.map((n: any) => ({ id: n.id, x: n.offsetX, y: n.offsetY })));
              }
            }, 100);
          }
        }
        break;
      }
      case 'delete_class': {
        const classId = event.payload.classId;
        this.umlClasses = this.umlClasses.filter(cls => cls.id !== classId);
        this.nodes = this.nodes.filter(n => n.id !== classId);
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
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
        }
        break;
      }
      case 'delete_relation': {
        const relationId = event.payload.relationId;
        this.umlRelations = this.umlRelations.filter(rel => rel.id !== relationId);
        this.connectors = this.connectors.filter(c => c.id !== relationId);
        if (this.diagramComponent) {
          const connector = this.diagramComponent.getConnectorObject(relationId);
          if (connector) {
            this.diagramComponent.remove(connector);
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
        }
        break;
      }
      case 'update_class': {
        const { classId, changes } = event.payload;
        // Actualizar datos de la clase
        const idx = this.umlClasses.findIndex(c => c.id === classId);
        if (idx !== -1) {
          this.umlClasses[idx] = { ...this.umlClasses[idx], ...changes };
        }
        // Actualizar nodo visual
        const nodeIdx = this.nodes.findIndex(n => n.id === classId);
        if (nodeIdx !== -1) {
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
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
        }
        break;
      }
      case 'move_element': {
        const { elementId, position } = event.payload;
        console.log('[COLABORACIÓN] 📥 RECIBIDO MOVE_ELEMENT');
        console.log('[COLABORACIÓN] 📥 ElementId:', elementId);
        console.log('[COLABORACIÓN] 📥 Position:', position);
        console.log('[COLABORACIÓN] 📥 Payload completo:', event.payload);
        
        // Activar bandera para evitar eventos circulares
        this.isApplyingCollabChange = true;
        console.log('[COLABORACIÓN] 🔒 Activando flag isApplyingCollabChange');
        
        try {
          // Actualizar posición en datos
          const classIdx = this.umlClasses.findIndex(c => c.id === elementId);
          if (classIdx !== -1) {
            this.umlClasses[classIdx].position = { ...position };
            console.log('[COLABORACIÓN] ✅ Clase UML actualizada:', this.umlClasses[classIdx]);
          } else {
            console.warn('[COLABORACIÓN] ⚠️ Clase UML no encontrada:', elementId);
          }
          
          // Actualizar nodo visual
          const nodeIdx = this.nodes.findIndex(n => n.id === elementId);
          if (nodeIdx !== -1) {
            this.nodes[nodeIdx].offsetX = position.x;
            this.nodes[nodeIdx].offsetY = position.y;
            console.log('[COLABORACIÓN] ✅ Nodo visual actualizado:', this.nodes[nodeIdx]);
            
            // Actualizar visualmente en el diagrama
            if (this.diagramComponent) {
              console.log('[COLABORACIÓN] 🎨 Actualizando diagrama visual...');
              const nodeObj = this.diagramComponent.getNodeObject(elementId);
              if (nodeObj) {
                console.log('[COLABORACIÓN] 🎨 Nodo encontrado en diagrama:', elementId);
                console.log('[COLABORACIÓN] 🎨 Posición anterior:', nodeObj.offsetX, nodeObj.offsetY);
                nodeObj.offsetX = position.x;
                nodeObj.offsetY = position.y;
                console.log('[COLABORACIÓN] 🎨 Nueva posición aplicada:', nodeObj.offsetX, nodeObj.offsetY);
                this.diagramComponent.dataBind();
                this.diagramComponent.refresh();
                console.log('[COLABORACIÓN] ✅ Diagrama actualizado y refrescado');
              } else {
                console.warn('[COLABORACIÓN] ⚠️ No se encontró objeto de nodo en diagrama:', elementId);
              }
            } else {
              console.error('[COLABORACIÓN] ❌ DiagramComponent no disponible');
            }
          } else {
            console.warn('[COLABORACIÓN] ⚠️ Nodo no encontrado en array:', elementId);
          }
        } catch (error) {
          console.error('[Colaboración] Error al aplicar movimiento:', error);
        }
        
        // Desactivar bandera después de un pequeño delay
        setTimeout(() => {
          this.isApplyingCollabChange = false;
          console.log('[Colaboración] Bandera isApplyingCollabChange desactivada');
        }, 200);
        
        break;
      }
      default:
        console.warn('[Colaboración] Tipo de evento no manejado:', event?.type);
    }
    
    // Guardar automáticamente después de cada cambio colaborativo
    console.log('[Colaboración] Llamando a auto-guardado');
    this.autoSaveDiagram();
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
    console.log('[MOVIMIENTO] onElementMoved disparado:', event);
    
    // Validar evento
    if (!event?.element?.id) {
      console.warn('[MOVIMIENTO] Evento inválido');
      return;
    }
    
    // No procesar si estamos aplicando cambio colaborativo
    if (this.isApplyingCollabChange) {
      console.log('[MOVIMIENTO] Ignorando - aplicando cambio colaborativo');
      return;
    }
    
    const elementId = event.element.id;
    const newX = event.element.offsetX;
    const newY = event.element.offsetY;
    
    console.log(`[MOVIMIENTO] Elemento ${elementId} movido a (${newX}, ${newY})`);
    
    // Actualizar datos locales
    this.updateLocalPosition(elementId, newX, newY);
    
    // Enviar evento colaborativo
    this.sendMoveEvent(elementId, newX, newY);
  }

  // Evento que se dispara cuando cambian propiedades del diagrama
  onPropertyChange(event: any) {
    console.log('[DEBUG] PropertyChange event COMPLETO:', event);
    console.log('[DEBUG] Event keys:', Object.keys(event || {}));
    
    // El evento puede tener diferentes estructuras
    let element = event?.element;
    let propertyName = event?.propertyName;
    let elementId = event?.element?.id;
    
    // Si element es undefined, pero hay otras propiedades, buscar el elemento de otra manera
    if (!element && event) {
      // Buscar propiedades que indiquen un elemento
      if (event.cause === 'ToolAction') {
        console.log('[DEBUG] 🔧 Evento de Tool Action detectado');
        // Buscar el elemento en el diagrama que se esté moviendo
        if (this.diagramComponent && this.diagramComponent.selectedItems && 
            this.diagramComponent.selectedItems.nodes && 
            this.diagramComponent.selectedItems.nodes.length > 0) {
          element = this.diagramComponent.selectedItems.nodes[0];
          console.log('[DEBUG] 🔧 Elemento encontrado via selectedItems:', element);
        }
      }
    }
    
    console.log('[DEBUG] Element final:', element);
    console.log('[DEBUG] Element.id final:', element?.id);
    console.log('[DEBUG] PropertyName:', propertyName);
    
    // Verificar si es un cambio de posición
    if (element && element.id && (propertyName === 'offsetX' || propertyName === 'offsetY' || !propertyName)) {
      console.log('[DEBUG] ⚠️ PROBLEMA DETECTADO - ID del elemento:', element.id);
      console.log('[DEBUG] ⚠️ Nuestros IDs de clases UML:', this.umlClasses.map(c => c.id));
      console.log('[DEBUG] ⚠️ IDs de nodos en array:', this.nodes.map(n => n.id));
      
      // Intentar encontrar el ID correcto usando posición
      const currentPos = { x: element.offsetX || 0, y: element.offsetY || 0 };
      console.log('[DEBUG] 🔍 Buscando por posición:', currentPos);
      
      // Buscar en nuestros nodos por ID directo primero
      let realElement = this.nodes.find(n => n.id === element.id);
      if (!realElement) {
        // Si no encuentra por ID, buscar por posición aproximada
        realElement = this.nodes.find(n => 
          Math.abs((n.offsetX || 0) - currentPos.x) < 10 && 
          Math.abs((n.offsetY || 0) - currentPos.y) < 10
        );
        console.log('[DEBUG] 🔍 Elemento encontrado por posición:', realElement);
      } else {
        console.log('[DEBUG] 🔍 Elemento encontrado por ID:', realElement);
      }
      
      if (realElement) {
        console.log('[DEBUG] ✅ Usando elemento real con ID:', realElement.id);
        // Usar las coordenadas actuales del elemento del diagrama
        const elementToUse = {
          ...realElement,
          offsetX: element.offsetX || realElement.offsetX,
          offsetY: element.offsetY || realElement.offsetY
        };
        this.handlePositionChangeDebounced(elementToUse);
      } else {
        console.warn('[DEBUG] ❌ No se pudo encontrar elemento real para:', element.id);
      }
    }
  }

  // Evento cuando se crea el diagrama
  onDiagramCreated(event: any) {
    console.log('[DEBUG] Diagram created event:', event);
  }

  // Debounce para manejar cambios de posición
  private positionChangeTimeout: any = null;
  private handlePositionChangeDebounced(element: any) {
    if (this.isApplyingCollabChange) {
      console.log('[MOVIMIENTO] Ignorando propertyChange - aplicando cambio colaborativo');
      return;
    }

    // Cancelar timeout anterior
    if (this.positionChangeTimeout) {
      clearTimeout(this.positionChangeTimeout);
    }

    // Procesar después de un pequeño delay
    this.positionChangeTimeout = setTimeout(() => {
      console.log('[MOVIMIENTO] *** PROCESANDO MOVIMIENTO VIA PROPERTY CHANGE ***');
      console.log('[MOVIMIENTO] Element:', element.id, 'Position:', element.offsetX, element.offsetY);
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
    
    console.log('[MOVIMIENTO] Datos locales actualizados');
  }
  
  private sendMoveEvent(elementId: string, x: number, y: number) {
    console.log('[MOVIMIENTO] 🚀 INICIANDO ENVÍO DE EVENTO');
    
    if (!this.collabComp) {
      console.error('[MOVIMIENTO] ❌ Componente colaborativo no disponible');
      console.error('[MOVIMIENTO] ❌ collabComp:', this.collabComp);
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
    
    console.log('[MOVIMIENTO] 📤 ENVIANDO EVENTO MOVE_ELEMENT:', moveEvent);
    console.log('[MOVIMIENTO] 📤 DiagramId:', this.diagramId);
    console.log('[MOVIMIENTO] 📤 ElementId:', elementId);
    console.log('[MOVIMIENTO] 📤 Position:', { x, y });
    console.log('[MOVIMIENTO] 📤 CollabComp disponible:', !!this.collabComp);
    console.log('[MOVIMIENTO] 📤 SendEvent function:', typeof this.collabComp.sendEvent);
    
    try {
      this.collabComp.sendEvent(moveEvent);
      console.log('[MOVIMIENTO] ✅ Evento enviado exitosamente');
    } catch (error) {
      console.error('[MOVIMIENTO] ❌ Error al enviar evento:', error);
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
    console.log('Botón Actualizar clase presionado');
    if (this.selectedUMLClass) {
      console.log('Clase seleccionada:', this.selectedUMLClass);
      this.updateNodeContent(this.selectedUMLClass);
      // Emitir evento colaborativo de edición de clase
      if (this.collabComp && this.collabComp.sendEvent) {
        this.collabComp.sendEvent({
          type: 'update_class',
          diagramId: this.diagramId,
          payload: {
            classId: this.selectedUMLClass.id,
            changes: { ...this.selectedUMLClass }
          }
        });
      }
    } else {
      console.log('No hay clase seleccionada');
    }
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
  savingVersion: boolean = false;
  saveError: string = '';
  // Bandera para evitar eventos circulares en colaboración
  private isApplyingCollabChange: boolean = false;
  // Control de auto-guardado
  private autoSaveTimeout: any = null;

  // Sincroniza los arrays de datos con los visuales antes de guardar
  syncDataFromVisuals() {
    console.log('[Sync] Sincronizando datos visuales');
    console.log('[Sync] UML Classes antes:', this.umlClasses.length);
    console.log('[Sync] Nodes actuales:', this.nodes.length);
    
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
        console.log('[Sync] Clase creada desde nodo:', newClass);
      }
    });
    
    // Remover clases que no tienen nodos correspondientes
    this.umlClasses = this.umlClasses.filter(cls => 
      this.nodes.some(node => node.id === cls.id)
    );
    
    console.log('[Sync] UML Classes después:', this.umlClasses.length);
    console.log('[Sync] Sincronización completada');
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
          console.log('[Auto-guardado] Cambios colaborativos guardados');
        },
        error: (err) => {
          console.warn('[Auto-guardado] Error al guardar cambios colaborativos:', err);
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
    private router: Router
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
    console.log('[DEBUG] ngOnInit ejecutado');
    this.diagramId = this.route.snapshot.paramMap.get('id') || '';
    console.log('[DEBUG] diagramId obtenido:', this.diagramId);
    
    // SIEMPRE cargar la versión más reciente, ignorar cualquier versionId en la URL
    // Esto asegura que después de un auto-guardado, al recargar se vea la versión nueva
    if (this.diagramId) {
      console.log('[DEBUG] Cargando SIEMPRE versión más reciente del diagrama:', this.diagramId);
      this.loadLatestVersion();
    } else {
      console.warn('[DEBUG] No hay diagramId disponible');
    }
  }

  // Cargar una versión específica
  private loadSpecificVersion(versionId: string): void {
    this.loadingVersion = true;
    console.log('[DEBUG] Llamando a getVersion con:', versionId);
    this.versionService.getVersion(versionId).subscribe({
      next: (data) => {
        this.loadingVersion = false;
        console.log('[DEBUG] RESPUESTA COMPLETA DEL BACKEND:', data);
        if (data && data.snapshot) {
          console.log('[DEBUG] PASANDO SNAPSHOT A loadSnapshotToCanvas:', data.snapshot);
          this.loadSnapshotToCanvas(data.snapshot);
        } else {
          console.warn('[DEBUG] No se encontró snapshot en la respuesta');
        }
      },
      error: (err) => {
        this.loadingVersion = false;
        console.error('[DEBUG] ERROR en getVersion:', err);
      }
    });
  }

  // Cargar la versión más reciente del diagrama
  private loadLatestVersion(): void {
    this.loadingVersion = true;
    console.log('[DEBUG] Cargando versión más reciente para diagrama:', this.diagramId);
    this.versionService.listVersions(this.diagramId, '-created_at').subscribe({
      next: (response: any) => {
        this.loadingVersion = false;
        console.log('[DEBUG] Respuesta de listVersions:', response);
        if (response && response.results && response.results.length > 0) {
          // Obtener la versión más reciente (primera en la lista ordenada por fecha desc)
          const latestVersion = response.results[0];
          console.log('[DEBUG] Versión más reciente encontrada:', latestVersion.id, latestVersion);
          this.loadSpecificVersion(latestVersion.id);
        } else {
          console.log('[DEBUG] No hay versiones guardadas, diagrama se inicia vacío');
        }
      },
      error: (err: any) => {
        this.loadingVersion = false;
        console.error('[DEBUG] ERROR al obtener versiones:', err);
      }
    });
  }

  // Cargar snapshot en el canvas y en las estructuras
  loadSnapshotToCanvas(snapshot: any) {
    console.log('[DEBUG] loadSnapshotToCanvas recibió:', snapshot);
    // Permitir snapshot anidado (caso backend)
    const snap = snapshot && snapshot.snapshot ? snapshot.snapshot : snapshot;
    console.log('[DEBUG] Snapshot final a usar:', snap);
    // Limpiar arrays
    this.umlClasses = [];
    this.umlRelations = [];
    this.nodes = [];
    this.connectors = [];
    // Poblar clases
    console.log('[DEBUG] Classes encontradas:', snap.classes);
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
      console.log('[DEBUG] 📋 NODOS GENERADOS desde snapshot:', this.nodes.map(n => ({ id: n.id, x: n.offsetX, y: n.offsetY })));
      
      // Verificar después de un tiempo que los IDs se mantengan en el diagrama
      setTimeout(() => {
        if (this.diagramComponent) {
          const diagramNodes = this.diagramComponent.nodes;
          console.log('[DEBUG] 📋 NODOS EN DIAGRAMA después de cargar:', diagramNodes.map((n: any) => ({ id: n.id, x: n.offsetX, y: n.offsetY })));
        }
      }, 500);
      
      console.log('[DEBUG] 📋 NODOS GENERADOS desde snapshot:', this.nodes.map(n => ({ id: n.id, x: n.offsetX, y: n.offsetY })));
    }
    // Poblar relaciones
    console.log('[DEBUG] Relations encontradas:', snap.relations);
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
      
      console.log('[DEBUG] CONECTORES GENERADOS:', this.connectors);
    }
    // Forzar refresco visual
    setTimeout(() => {
      if (this.diagramComponent) {
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
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
    }
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
    console.log('[DiagramShow] Relación seleccionada:', relationType);
    this.selectedRelationType = relationType;
    // Al seleccionar una relación, resetea selección de nodos
    this.selectedSourceNodeId = null;
    this.selectedTargetNodeId = null;
  }


  // Manejar clic en nodo del diagrama (evento de Syncfusion)
  onNodeClick(event: any): void {
    if (event && event.element && event.element.id) {
      const nodeId = event.element.id;
      console.log('[onNodeClick] Nodo clickeado:', nodeId, 'Tipo relación:', this.selectedRelationType);
      if (!this.selectedRelationType) return;
      if (!this.selectedSourceNodeId) {
        this.selectedSourceNodeId = nodeId;
        console.log('[onNodeClick] Nodo origen seleccionado:', nodeId);
        return;
      }
      if (!this.selectedTargetNodeId && nodeId !== this.selectedSourceNodeId) {
        this.selectedTargetNodeId = nodeId;
        console.log('[onNodeClick] Nodo destino seleccionado:', nodeId);
        this.createRelationConnector();
      }
    }
  }

  // Crear el conector visual según el tipo de relación UML
  createRelationConnector(): void {
    if (!this.selectedSourceNodeId || !this.selectedTargetNodeId || !this.selectedRelationType) {
      console.warn('[createRelationConnector] Faltan datos para crear la relación');
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
    
    // Emitir evento colaborativo de eliminar relación
    if (this.collabComp && this.collabComp.sendEvent) {
      this.collabComp.sendEvent({
        type: 'delete_relation',
        diagramId: this.diagramId,
        payload: { relationId: this.selectedUMLRelationId }
      });
    }
    
    this.umlRelations = this.umlRelations.filter(rel => rel.id !== this.selectedUMLRelationId);
    this.connectors = this.connectors.filter(c => c.id !== this.selectedUMLRelationId);
    if (this.diagramComponent) {
      const connector = this.diagramComponent.getConnectorObject(this.selectedUMLRelationId);
      if (connector) {
        this.diagramComponent.remove(connector);
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
      }
    }
    this.selectedUMLRelationId = null;
  }

  // Devuelve la clase UML real asociada a un nodo del diagrama
  getUMLClassByNodeId(nodeId: string): UMLClass | null {
  return this.umlClasses.find((c: UMLClass) => c.id === nodeId) || null;
  }

  // Actualiza el contenido visual del nodo en el canvas
  updateNodeContent(umlClass: UMLClass | null) {
    if (!umlClass) return;
    
    console.log('updateNodeContent llamado para:', umlClass.name, 'ID:', umlClass.id);
    
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
    
    console.log('Contenido generado:', content);
    
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
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
        
        console.log('Nodo recreado con nuevo contenido');
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

  ngAfterViewInit(): void {
    // Verificar que el componente de colaboración esté disponible
    console.log('[DEBUG] ngAfterViewInit - collabComp disponible:', !!this.collabComp);
    if (this.collabComp) {
      console.log('[DEBUG] Componente de colaboración inicializado correctamente');
    } else {
      console.error('[DEBUG] Componente de colaboración NO está disponible');
    }
  }

  ngOnDestroy(): void {
    // Limpiar timeout de auto-guardado
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

}
