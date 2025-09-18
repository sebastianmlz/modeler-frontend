

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


import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagramVersionService } from './diagram-version.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShowSidebarComponent } from './show-sidebar/show-sidebar.component';
import { DiagramModule, NodeModel, ConnectorModel, DiagramComponent } from '@syncfusion/ej2-angular-diagrams';


// ...existing code...

@Component({
  selector: 'app-diagram-show',
  standalone: true,
  imports: [CommonModule, FormsModule, ShowSidebarComponent, DiagramModule],
  templateUrl: './diagram-show.component.html',
  styleUrl: './diagram-show.component.css'
})
export class DiagramShowComponent implements OnInit {
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

  // Sincroniza los arrays de datos con los visuales antes de guardar
  syncDataFromVisuals() {
    // Sincronizar clases
    this.umlClasses = this.nodes.map(node => {
      // Buscar la clase real por id
      let found = this.umlClasses.find(cls => cls.id === node.id);
      if (found) return found;
      // Si no existe, crear una clase mínima
      return {
        id: node.id || '',
        name: node.annotations?.[0]?.content || 'Clase',
        visibility: 'PUBLIC',
        position: { x: node.offsetX || 0, y: node.offsetY || 0 },
        size: { w: node.width || 150, h: node.height || 80 },
        attributes: []
      };
    });
    // Sincronizar relaciones (filtrar conectores solo visuales)
    this.umlRelations = this.connectors
      .filter(conn => !conn.id?.startsWith('assoc_line_') && !conn.id?.startsWith('visual_')) // Excluir conectores puramente visuales
      .map(conn => {
        let found = this.umlRelations.find(rel => rel.id === conn.id);
        if (found) return found;
        // Si no existe, crear una relación mínima
        return {
          id: conn.id || '',
          sourceId: conn.sourceID || '',
          targetId: conn.targetID || '',
          type: 'Asociación'
        };
      });
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
  // Captura versionId de la ruta o de los query params
  this.versionId = this.route.snapshot.paramMap.get('versionId') || this.route.snapshot.queryParamMap.get('versionId') || '';
  console.log('[DEBUG] versionId obtenido:', this.versionId);
    if (this.versionId) {
      this.loadingVersion = true;
      console.log('[DEBUG] Llamando a getVersion con:', this.versionId);
      this.versionService.getVersion(this.versionId).subscribe({
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
        // error: (err) => {
        //   this.loadingVersion = false;
        //   this.loadError = 'No se pudo cargar la versión.';
        // }
      });
    }
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
          style: { fill: '#fff', strokeColor: '#000', strokeWidth: 2 }
        };
      });
      console.log('[DEBUG] NODOS GENERADOS:', this.nodes);
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
      style: { fill: '#ffffff', strokeColor: '#000000', strokeWidth: 2 }
    };
    this.nodes.push(newNode);
    if (this.diagramComponent) {
      this.diagramComponent.addNode(newNode);
      this.diagramComponent.clearSelection();
      this.diagramComponent.dataBind();
      this.diagramComponent.refresh();
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
  }

  // Eliminar relación seleccionada (ya implementado, pero asegúrate de esto)
  deleteSelectedRelation() {
    if (!this.selectedUMLRelationId) return;
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
      style: { fill: '#ffffff', strokeColor: '#000000', strokeWidth: 2 }
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

}
