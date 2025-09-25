

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
import { MembersService } from './members.service';

// ...existing code...

@Component({
  selector: 'app-diagram-show',
  standalone: true,
  imports: [CommonModule, FormsModule, ShowSidebarComponent, DiagramModule,DiagramCollaborationComponent],
  templateUrl: './diagram-show.component.html',
  styleUrl: './diagram-show.component.css'
})
export class DiagramShowComponent implements OnInit, OnDestroy, AfterViewInit {
    // Miembros colaborativos conectados en tiempo real
    collabMembers: any[] = [];
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
    
    // FILTRAR NUESTROS PROPIOS EVENTOS PARA EVITAR CICLOS
    if ((event as any).senderId && this.collabComp) {
      const ourWindowId = (this.collabComp as any).collaboration?.windowId;
      if (ourWindowId && (event as any).senderId === ourWindowId) {
        console.log('[COLABORACIÓN] 🚫 IGNORANDO NUESTRO PROPIO EVENTO - senderId:', (event as any).senderId);
        return;
      }
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
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.nodes = [...this.nodes];
            this.diagramComponent.connectors = [...this.connectors];
            
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
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.connectors = [...this.connectors];
            if (this.diagramComponent.nodes) {
              this.diagramComponent.nodes = [...this.nodes];
            }
            
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
        }
        break;
      }
      case 'delete_relation': {
        const relationId = event.payload.relationId;
        console.log('[COLABORACIÓN] 📥 RECIBIDO DELETE_RELATION');
        console.log('[COLABORACIÓN] 📥 RelationId:', relationId);
        
        // Activar bandera para evitar eventos circulares
        console.log('[COLABORACIÓN] 🔒 Activando flag isApplyingCollabChange');
        this.isApplyingCollabChange = true;
        
        // Actualizar datos locales
        this.umlRelations = this.umlRelations.filter(rel => rel.id !== relationId);
        this.connectors = this.connectors.filter(c => c.id !== relationId);
        console.log('[COLABORACIÓN] ✅ Arrays locales actualizados');
        
        if (this.diagramComponent) {
          const connector = this.diagramComponent.getConnectorObject(relationId);
          if (connector) {
            console.log('[COLABORACIÓN] 🎨 Eliminando conector del diagrama:', relationId);
            this.diagramComponent.remove(connector);
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.connectors = [...this.connectors];
            this.diagramComponent.nodes = [...this.nodes];
            
            console.log('[COLABORACIÓN] 🎨 Actualizando diagrama visual...');
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
            console.log('[COLABORACIÓN] ✅ Diagrama actualizado visualmente');
          } else {
            console.warn('[COLABORACIÓN] ⚠️ Conector no encontrado en diagrama:', relationId);
          }
        }
        
        // Resetear selección si se eliminó la relación seleccionada
        if (this.selectedUMLRelationId === relationId) {
          this.selectedUMLRelationId = null;
          console.log('[COLABORACIÓN] ✅ Selección de relación reseteada');
        }
        
        // Desactivar bandera
        setTimeout(() => {
          this.isApplyingCollabChange = false;
          console.log('[COLABORACIÓN] Bandera isApplyingCollabChange desactivada');
        }, 100);
        
        break;
      }
      case 'update_class': {
        console.log('[COLABORACIÓN] 📥 RECIBIDO UPDATE_CLASS');
        const { classId, changes } = event.payload;
        console.log('[COLABORACIÓN] 📥 ClassId:', classId);
        console.log('[COLABORACIÓN] 📥 Changes:', changes);
        
        // Activar bandera para evitar eventos circulares
        console.log('[COLABORACIÓN] 🔒 Activando flag isApplyingCollabChange');
        this.isApplyingCollabChange = true;
        
        try {
          // Actualizar datos de la clase
          const idx = this.umlClasses.findIndex(c => c.id === classId);
          if (idx !== -1) {
            console.log('[COLABORACIÓN] 📝 Clase encontrada en índice:', idx);
            console.log('[COLABORACIÓN] 📝 Clase antes:', this.umlClasses[idx]);
            this.umlClasses[idx] = { ...this.umlClasses[idx], ...changes };
            console.log('[COLABORACIÓN] 📝 Clase después:', this.umlClasses[idx]);
          } else {
            console.warn('[COLABORACIÓN] ⚠️ Clase no encontrada con ID:', classId);
            break;
          }
          
          // Actualizar nodo visual
          const nodeIdx = this.nodes.findIndex(n => n.id === classId);
          if (nodeIdx !== -1) {
            console.log('[COLABORACIÓN] 🎨 Nodo encontrado en índice:', nodeIdx);
            console.log('[COLABORACIÓN] 🎨 Nodo antes:', this.nodes[nodeIdx]);
            
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
            
            console.log('[COLABORACIÓN] 🎨 Nodo después:', this.nodes[nodeIdx]);
            
            if (this.diagramComponent) {
              const nodeObj = this.diagramComponent.getNodeObject(classId);
              if (nodeObj) {
                console.log('[COLABORACIÓN] 🎨 Eliminando nodo anterior del diagrama');
                this.diagramComponent.remove(nodeObj);
              }
              console.log('[COLABORACIÓN] 🎨 Agregando nodo actualizado al diagrama');
              this.diagramComponent.add(this.nodes[nodeIdx]);
              
              // Actualizar referencias de arrays para sincronización
              this.diagramComponent.nodes = [...this.nodes];
              this.diagramComponent.connectors = [...this.connectors];
              
              console.log('[COLABORACIÓN] 🎨 Actualizando diagrama visual...');
              this.diagramComponent.dataBind();
              this.diagramComponent.refresh();
              console.log('[COLABORACIÓN] ✅ Diagrama actualizado visualmente');
            }
          } else {
            console.warn('[COLABORACIÓN] ⚠️ Nodo no encontrado con ID:', classId);
          }
          
          console.log('[COLABORACIÓN] ✅ UPDATE_CLASS procesado exitosamente');
        } catch (error) {
          console.error('[COLABORACIÓN] 💥 Error procesando UPDATE_CLASS:', error);
        } finally {
          // Desactivar bandera después de un pequeño delay
          setTimeout(() => {
            this.isApplyingCollabChange = false;
            console.log('[COLABORACIÓN] 🔓 Bandera isApplyingCollabChange desactivada');
          }, 100);
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
              
              try {
                // Buscar en nodes array del diagrama
                let nodeObj = null;
                if (this.diagramComponent.nodes) {
                  nodeObj = this.diagramComponent.nodes.find(n => n.id === elementId);
                  console.log('[COLABORACIÓN] 🎨 Nodo encontrado en array:', nodeObj);
                }
                
                if (nodeObj) {
                  console.log('[COLABORACIÓN] 🎨 Nodo encontrado en diagrama:', elementId);
                  console.log('[COLABORACIÓN] 🎨 Posición anterior:', nodeObj.offsetX, nodeObj.offsetY);
                  
                  // Actualizar posición del nodo
                  nodeObj.offsetX = position.x;
                  nodeObj.offsetY = position.y;
                  console.log('[COLABORACIÓN] 🎨 Nueva posición aplicada:', nodeObj.offsetX, nodeObj.offsetY);
                  
                  // CLAVE: Crear nueva referencia del array para forzar detección de cambios de Angular
                  this.diagramComponent.nodes = [...this.diagramComponent.nodes];
                  console.log('[COLABORACIÓN] ✅ Array de nodos actualizado con nueva referencia');
                  
                  // IMPORTANTE: También actualizar conectores para mantener relaciones visibles
                  if (this.diagramComponent.connectors && this.connectors) {
                    this.diagramComponent.connectors = [...this.connectors];
                    console.log('[COLABORACIÓN] ✅ Array de conectores actualizado con nueva referencia');
                  }
                  
                  try {
                    this.diagramComponent.dataBind();
                    console.log('[COLABORACIÓN] ✅ dataBind ejecutado');
                  } catch (e) {
                    console.log('[COLABORACIÓN] ⚠️ dataBind falló:', e);
                  }
                  
                  try {
                    this.diagramComponent.refresh();
                    console.log('[COLABORACIÓN] ✅ refresh ejecutado');
                  } catch (e) {
                    console.log('[COLABORACIÓN] ⚠️ refresh falló:', e);
                  }
                  
                  console.log('[COLABORACIÓN] ✅ Diagrama actualizado visualmente');
                } else {
                  console.warn('[COLABORACIÓN] ⚠️ No se encontró objeto de nodo en diagrama:', elementId);
                  
                  // Método de fallback: Actualizar todo el diagrama
                  console.log('[COLABORACIÓN] 🔄 Aplicando actualización de fallback...');
                  try {
                    // Sincronizar arrays completos
                    this.diagramComponent.nodes = [...this.nodes];
                    this.diagramComponent.connectors = [...this.connectors];
                    this.diagramComponent.dataBind();
                    this.diagramComponent.refresh();
                    console.log('[COLABORACIÓN] ✅ Fallback completado - diagrama sincronizado');
                  } catch (e) {
                    console.error('[COLABORACIÓN] ❌ Fallback falló:', e);
                  }
                }
              } catch (error) {
                console.error('[COLABORACIÓN] ❌ Error general en actualización visual:', error);
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
        
        // Desactivar bandera después de un delay más largo para evitar ciclos
        setTimeout(() => {
          this.isApplyingCollabChange = false;
          console.log('[Colaboración] Bandera isApplyingCollabChange desactivada');
        }, 300); // Reducido a 300ms para mejor responsividad
        
        break;
      }
      case 'delete_class': {
        console.log('[COLABORACIÓN] 📥 RECIBIDO DELETE_CLASS');
        const classId = event.payload.classId;
        console.log('[COLABORACIÓN] 📥 ClassId a eliminar:', classId);
        
        // Activar bandera para evitar eventos circulares
        console.log('[COLABORACIÓN] 🔒 Activando flag isApplyingCollabChange');
        this.isApplyingCollabChange = true;
        
        try {
          // 1. Eliminar relaciones que usan esta clase
          console.log('[COLABORACIÓN] 🗑️ Eliminando relaciones que usan la clase...');
          const relationsToDelete = this.umlRelations.filter(
            rel => rel.sourceId === classId || rel.targetId === classId
          );
          
          console.log('[COLABORACIÓN] 🗑️ Relaciones a eliminar:', relationsToDelete.length);
          relationsToDelete.forEach(rel => {
            console.log('[COLABORACIÓN] 🗑️ Eliminando relación:', rel.id);
            
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
          console.log('[COLABORACIÓN] 🗑️ Eliminando clase del array UML...');
          const classIndex = this.umlClasses.findIndex(c => c.id === classId);
          if (classIndex !== -1) {
            console.log('[COLABORACIÓN] 🗑️ Clase eliminada:', this.umlClasses[classIndex]);
            this.umlClasses.splice(classIndex, 1);
          }
          
          // 3. Eliminar nodo visual del diagrama
          console.log('[COLABORACIÓN] 🗑️ Eliminando nodo visual...');
          const nodeIndex = this.nodes.findIndex(n => n.id === classId);
          if (nodeIndex !== -1) {
            console.log('[COLABORACIÓN] 🗑️ Nodo eliminado:', this.nodes[nodeIndex]);
            this.nodes.splice(nodeIndex, 1);
          }
          
          // 4. Eliminar del diagrama visual
          if (this.diagramComponent) {
            const nodeObj = this.diagramComponent.getNodeObject(classId);
            if (nodeObj) {
              console.log('[COLABORACIÓN] 🎨 Eliminando nodo del diagrama visual');
              this.diagramComponent.remove(nodeObj);
            }
            
            // Actualizar referencias de arrays para sincronización
            this.diagramComponent.nodes = [...this.nodes];
            this.diagramComponent.connectors = [...this.connectors];
            
            console.log('[COLABORACIÓN] 🎨 Actualizando diagrama visual...');
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
          
          // 5. Limpiar selección si era la clase eliminada
          if (this.selectedUMLClass?.id === classId) {
            this.selectedUMLClass = null;
            console.log('[COLABORACIÓN] 🧹 Selección de clase limpiada');
          }
          
          console.log('[COLABORACIÓN] ✅ DELETE_CLASS procesado exitosamente');
        } catch (error) {
          console.error('[COLABORACIÓN] 💥 Error procesando DELETE_CLASS:', error);
        } finally {
          // Desactivar bandera después de un pequeño delay
          setTimeout(() => {
            this.isApplyingCollabChange = false;
            console.log('[COLABORACIÓN] 🔓 Bandera isApplyingCollabChange desactivada');
          }, 100);
        }
        
        break;
      }
      default:
        console.warn('[Colaboración] Tipo de evento no manejado:', event?.type);
    }
    
    // REMOVED: Auto-guardado colaborativo para evitar race conditions
    // Solo la ventana que origina el cambio debe auto-guardar
    console.log('[Colaboración] ✅ Evento colaborativo procesado sin auto-guardado');
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
    console.log('🚀 [DRAG-STOP] ===== EVENTO DETECTADO =====');
    console.log('🚀 [DRAG-STOP] Event completo:', event);
    console.log('🚀 [DRAG-STOP] Element:', event?.element);
    console.log('🚀 [DRAG-STOP] Element ID:', event?.element?.id);
    console.log('🚀 [DRAG-STOP] Position:', { x: event?.element?.offsetX, y: event?.element?.offsetY });
    console.log('🚀 [DRAG-STOP] ===============================');
    
    // Validar evento
    if (!event?.element?.id) {
      console.warn('🚀 [DRAG-STOP] ❌ Evento inválido - falta element.id');
      return;
    }
    
    // No procesar si estamos aplicando cambio colaborativo
    if (this.isApplyingCollabChange) {
      console.log('🚀 [DRAG-STOP] ⏸️ Ignorando - aplicando cambio colaborativo');
      return;
    }
    
    const elementId = event.element.id;
    const newX = event.element.offsetX;
    const newY = event.element.offsetY;
    
    console.log(`🚀 [DRAG-STOP] ✅ PROCESANDO: ${elementId} → (${newX}, ${newY})`);
    
    // Verificar que es uno de nuestros elementos
    const isOurElement = this.nodes.find(n => n.id === elementId);
    if (!isOurElement) {
      console.warn('🚀 [DRAG-STOP] ❌ Elemento no es nuestro:', elementId);
      console.log('🚀 [DRAG-STOP] Nuestros nodos:', this.nodes.map(n => n.id));
      return;
    }
    
    console.log('🚀 [DRAG-STOP] ✅ Elemento confirmado como nuestro');
    
    // Actualizar datos locales
    this.updateLocalPosition(elementId, newX, newY);
    
    // Enviar evento colaborativo
    this.sendMoveEvent(elementId, newX, newY);
  }

  // Evento que se dispara cuando cambian propiedades del diagrama
  onPropertyChange(event: any) {
    console.log('🔥 [PROPERTY-CHANGE] ===== EVENTO DETECTADO =====');
    console.log('🔥 [PROPERTY-CHANGE] Event completo:', event);
    console.log('🔥 [PROPERTY-CHANGE] Event keys:', Object.keys(event || {}));
    console.log('🔥 [PROPERTY-CHANGE] Cause:', event?.cause);
    console.log('🔥 [PROPERTY-CHANGE] PropertyName:', event?.propertyName);
    console.log('🔥 [PROPERTY-CHANGE] Element:', event?.element);
    console.log('🔥 [PROPERTY-CHANGE] Element ID:', event?.element?.id);
    console.log('🔥 [PROPERTY-CHANGE] ===============================');
    
    // El evento puede tener diferentes estructuras
    let element = event?.element;
    let propertyName = event?.propertyName;
    let elementId = event?.element?.id;
    
    // Si element es undefined, pero hay otras propiedades, buscar el elemento de otra manera
    if (!element && event) {
      console.log('🔥 [PROPERTY-CHANGE] Element undefined, buscando alternativas...');
      // Buscar propiedades que indiquen un elemento
      if (event.cause === 'ToolAction') {
        console.log('🔥 [PROPERTY-CHANGE] 🔧 Evento de Tool Action detectado');
        // Buscar el elemento en el diagrama que se esté moviendo
        if (this.diagramComponent && this.diagramComponent.selectedItems && 
            this.diagramComponent.selectedItems.nodes && 
            this.diagramComponent.selectedItems.nodes.length > 0) {
          element = this.diagramComponent.selectedItems.nodes[0];
          console.log('🔥 [PROPERTY-CHANGE] 🔧 Elemento encontrado via selectedItems:', element);
        }
      }
    }
    
    console.log('🔥 [PROPERTY-CHANGE] Element final:', element);
    console.log('🔥 [PROPERTY-CHANGE] Element.id final:', element?.id);
    console.log('🔥 [PROPERTY-CHANGE] PropertyName final:', propertyName);
    
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
    
    console.log('🔥 [PROPERTY-CHANGE] ¿Es evento de movimiento?', isMovementEvent);
    
    // Si no hay element pero parece ser movimiento, intentar obtenerlo
    if (isMovementEvent && !element && event?.cause === 'ToolAction') {
      if (this.diagramComponent && this.diagramComponent.selectedItems && 
          this.diagramComponent.selectedItems.nodes && 
          this.diagramComponent.selectedItems.nodes.length > 0) {
        element = this.diagramComponent.selectedItems.nodes[0];
        console.log('🔥 [PROPERTY-CHANGE] 🔍 Element obtenido de selectedItems:', element);
      }
    }
    
    // Verificar si es un cambio de posición
    if (isMovementEvent && element) {
      console.log('🔥 [PROPERTY-CHANGE] ✅ ES CAMBIO DE POSICIÓN');
      console.log('🔥 [PROPERTY-CHANGE] Element completo:', element);
      console.log('🔥 [PROPERTY-CHANGE] ID del elemento:', element.id);
      console.log('🔥 [PROPERTY-CHANGE] Posición del elemento:', { x: element.offsetX, y: element.offsetY });
      console.log('🔥 [PROPERTY-CHANGE] Nuestros IDs de clases UML:', this.umlClasses.map(c => c.id));
      console.log('🔥 [PROPERTY-CHANGE] IDs de nodos en array:', this.nodes.map(n => n.id));
      
      // Si no tiene ID, intentar encontrarlo por posición
      let elementToProcess = element;
      if (!element.id) {
        console.log('🔥 [PROPERTY-CHANGE] ⚠️ Element sin ID, buscando por posición...');
        const currentPos = { x: element.offsetX || 0, y: element.offsetY || 0 };
        console.log('🔥 [PROPERTY-CHANGE] 🔍 Posición actual:', currentPos);
        
        const nodeByPosition = this.nodes.find(n => 
          Math.abs((n.offsetX || 0) - currentPos.x) < 10 && 
          Math.abs((n.offsetY || 0) - currentPos.y) < 10
        );
        
        if (nodeByPosition) {
          console.log('🔥 [PROPERTY-CHANGE] ✅ Nodo encontrado por posición:', nodeByPosition.id);
          elementToProcess = {
            ...element,
            id: nodeByPosition.id
          };
        } else {
          console.warn('🔥 [PROPERTY-CHANGE] ❌ No se encontró nodo por posición');
          return;
        }
      }
      
      // Verificar que es uno de nuestros elementos
      const realElement = this.nodes.find(n => n.id === elementToProcess.id);
      if (!realElement) {
        console.warn('🔥 [PROPERTY-CHANGE] ❌ Elemento no es nuestro:', elementToProcess.id);
        return;
      }
      
      console.log('🔥 [PROPERTY-CHANGE] ✅ PROCESANDO MOVIMIENTO con ID:', elementToProcess.id);
      // Usar las coordenadas actuales del elemento del diagrama
      const elementToUse = {
        ...realElement,
        offsetX: elementToProcess.offsetX || realElement.offsetX,
        offsetY: elementToProcess.offsetY || realElement.offsetY
      };
      this.handlePositionChangeDebounced(elementToUse);
    } else {
      console.log('🔥 [PROPERTY-CHANGE] ❌ NO es cambio de posición o elemento inválido');
    }
  }

  // Evento cuando se crea el diagrama
  onDiagramCreated(event: any) {
    console.log('[DEBUG] Diagram created event:', event);
  }

  // Debounce para manejar cambios de posición
  private positionChangeTimeout: any = null;
  
  private handlePositionChangeDebounced(element: any) {
    console.log('[MOVIMIENTO] 📍 Procesando cambio de posición debounced:', element.id);
    
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
    
    // Auto-guardar los cambios locales
    console.log('[MOVIMIENTO] 💾 Guardando cambios locales automáticamente');
    this.autoSaveDiagram();
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

  // ===== SISTEMA DE MONITOREO DE POSICIONES (RESPALDO) =====
  
  // Inicializar el monitoreo de posiciones
  private startPositionMonitoring() {
    console.log('🔄 [POSITION-MONITOR] Iniciando monitoreo de posiciones...');
    
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
    
    console.log('🔄 [POSITION-MONITOR] Posiciones iniciales actualizadas:', this.lastKnownPositions.size);
  }
  
  // Detener el monitoreo
  private stopPositionMonitoring() {
    if (this.positionMonitorInterval) {
      clearInterval(this.positionMonitorInterval);
      this.positionMonitorInterval = null;
      console.log('🔄 [POSITION-MONITOR] Monitoreo detenido');
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
    console.log('[ACTUALIZAR CLASE] 🔄 INICIANDO ACTUALIZACIÓN LOCAL');
    console.log('[ACTUALIZAR CLASE] 🔄 Botón Actualizar clase presionado');
    
    if (!this.selectedUMLClass) {
      console.warn('[ACTUALIZAR CLASE] ⚠️ No hay clase seleccionada');
      return;
    }
    
    // Crear una copia de la clase antes de proceder para evitar referencias null
    const classToUpdate = { ...this.selectedUMLClass };
    console.log('[ACTUALIZAR CLASE] 📝 Clase a actualizar (copia):', classToUpdate);
    console.log('[ACTUALIZAR CLASE] 📝 ID de la clase:', classToUpdate.id);
    console.log('[ACTUALIZAR CLASE] 📝 Nombre de la clase:', classToUpdate.name);
    console.log('[ACTUALIZAR CLASE] 📝 Atributos:', classToUpdate.attributes);
    
    // Validar que la clase tenga ID válido
    if (!classToUpdate.id) {
      console.error('[ACTUALIZAR CLASE] ❌ La clase no tiene ID válido');
      return;
    }
    
    // Actualizar contenido visual del nodo
    this.updateNodeContent(classToUpdate);
    console.log('[ACTUALIZAR CLASE] 🎨 Contenido visual actualizado');
    
    // Auto-guardar cambios localmente
    console.log('[ACTUALIZAR CLASE] 💾 Guardando cambios de clase automáticamente');
    this.autoSaveDiagram();
    
    // Emitir evento colaborativo de edición de clase
    console.log('[ACTUALIZAR CLASE] 📤 VERIFICANDO COMPONENTE COLABORATIVO');
    console.log('[ACTUALIZAR CLASE] 📤 collabComp existe:', !!this.collabComp);
    console.log('[ACTUALIZAR CLASE] 📤 diagramId existe:', !!this.diagramId);
    console.log('[ACTUALIZAR CLASE] 📤 diagramId valor:', this.diagramId);
    
    if (!this.collabComp) {
      console.error('[ACTUALIZAR CLASE] ❌ Componente colaborativo no está disponible');
      return;
    }
    
    if (!this.diagramId) {
      console.error('[ACTUALIZAR CLASE] ❌ DiagramId no está disponible');
      return;
    }
    
    console.log('[ACTUALIZAR CLASE] 📤 sendEvent existe:', !!this.collabComp.sendEvent);
    
    if (!this.collabComp.sendEvent) {
      console.error('[ACTUALIZAR CLASE] ❌ Método sendEvent no está disponible');
      return;
    }
    
    console.log('[ACTUALIZAR CLASE] 📤 PREPARANDO EVENTO COLABORATIVO');
    
    const eventData: DiagramCollabEvent = {
      type: 'update_class' as const,
      diagramId: this.diagramId,
      payload: {
        classId: classToUpdate.id,
        changes: { ...classToUpdate }
      }
    };
    
    console.log('[ACTUALIZAR CLASE] 📤 Datos del evento:', eventData);
    console.log('[ACTUALIZAR CLASE] 📤 DiagramId:', this.diagramId);
    console.log('[ACTUALIZAR CLASE] 📤 ClassId:', classToUpdate.id);
    
    try {
      console.log('[ACTUALIZAR CLASE] � ENVIANDO EVENTO COLABORATIVO...');
      this.collabComp.sendEvent(eventData);
      console.log('[ACTUALIZAR CLASE] ✅ Evento colaborativo enviado exitosamente');
    } catch (error) {
      console.error('[ACTUALIZAR CLASE] 💥 Error enviando evento colaborativo:', error);
    }
    
    console.log('[ACTUALIZAR CLASE] ✅ ACTUALIZACIÓN LOCAL COMPLETADA');
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
      
      // Log detallado de lo que se enviará al backend
      console.log('[Auto-guardado][DEBUG] Payload enviado al backend:', {
        diagramId,
        snapshot,
        message
      });
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
    console.log('[DEBUG] ngOnInit ejecutado');
    // Obtener diagramId de la URL
    this.diagramId = this.route.snapshot.paramMap.get('id') || '';
    console.log('[DEBUG] diagramId obtenido:', this.diagramId);
    // Obtener versionId de la URL (puede venir como route param o query param)
    this.versionId = this.route.snapshot.paramMap.get('versionId') || this.route.snapshot.queryParamMap.get('versionId') || '';
    console.log('[DEBUG] versionId obtenido:', this.versionId);
    // Obtener token JWT del localStorage para WebSocket
    this.token = localStorage.getItem('access') || '';
    console.log('[DEBUG] token obtenido:', this.token ? 'Token presente' : 'No hay token');
    console.log('[DEBUG] Token (primeros 20 chars):', this.token ? this.token.substring(0, 20) + '...' : 'N/A');

    if (this.diagramId) {
      // Cargar miembros del diagrama
      this.membersService.getDiagramMembers(this.diagramId).subscribe({
        next: (resp: { members: { id: string; name: string; email?: string; avatarUrl?: string }[] }) => {
          this.collabMembers = resp.members || [];
          console.log('[Miembros] Miembros cargados:', this.collabMembers);
        },
        error: (err: unknown) => {
          console.error('[Miembros] Error al cargar miembros:', err);
        }
      });
      // Si hay versionId en la URL, redirigir a la ruta sin versionId para forzar siempre la última versión
      if (this.versionId) {
        console.log('[DEBUG] Redirigiendo a la ruta sin versionId para mostrar SIEMPRE la versión más reciente');
        this.router.navigate(['/diagram/show', this.diagramId]);
        // No continuar, la recarga hará que se muestre la última versión
        return;
      }
      // Si no hay versionId, cargar la última versión
      console.log('[DEBUG] Cargando versión más reciente');
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
    console.log('[NUEVA CLASE] 💾 Guardando nueva clase automáticamente');
    this.autoSaveDiagram();
    
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
    
    // Auto-guardar cambios localmente
    console.log('[NUEVA RELACIÓN] 💾 Guardando nueva relación automáticamente');
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
    console.log('[ELIMINAR CLASE] 💾 Guardando eliminación automáticamente');
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
    
    console.log('[ELIMINAR RELACIÓN] 🗑️ INICIANDO ELIMINACIÓN LOCAL');
    console.log('[ELIMINAR RELACIÓN] 🗑️ RelationId:', this.selectedUMLRelationId);
    
    const relationToDelete = this.selectedUMLRelationId;
    
    this.umlRelations = this.umlRelations.filter(rel => rel.id !== relationToDelete);
    this.connectors = this.connectors.filter(c => c.id !== relationToDelete);
    console.log('[ELIMINAR RELACIÓN] ✅ Arrays locales actualizados');
    
    if (this.diagramComponent) {
      const connector = this.diagramComponent.getConnectorObject(relationToDelete);
      if (connector) {
        console.log('[ELIMINAR RELACIÓN] 🎨 Eliminando conector del diagrama');
        this.diagramComponent.remove(connector);
        
        // Actualizar referencias de arrays para sincronización
        this.diagramComponent.connectors = [...this.connectors];
        
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
        console.log('[ELIMINAR RELACIÓN] ✅ Diagrama actualizado visualmente');
      } else {
        console.warn('[ELIMINAR RELACIÓN] ⚠️ Conector no encontrado en diagrama');
      }
    }
    
    // Auto-guardar cambios localmente
    console.log('[ELIMINAR RELACIÓN] 💾 Guardando eliminación automáticamente');
    this.autoSaveDiagram();
    
    // Emitir evento colaborativo de eliminar relación
    console.log('[ELIMINAR RELACIÓN] 📤 ENVIANDO EVENTO COLABORATIVO');
    if (this.collabComp && this.collabComp.sendEvent) {
      this.collabComp.sendEvent({
        type: 'delete_relation',
        diagramId: this.diagramId,
        payload: { relationId: relationToDelete }
      });
      console.log('[ELIMINAR RELACIÓN] ✅ Evento colaborativo enviado');
    } else {
      console.error('[ELIMINAR RELACIÓN] ❌ No se pudo enviar evento colaborativo');
    }
    
    this.selectedUMLRelationId = null;
    console.log('[ELIMINAR RELACIÓN] ✅ ELIMINACIÓN LOCAL COMPLETADA');
  }

  // Eliminar clase seleccionada con sincronización colaborativa
  deleteSelectedClass() {
    if (!this.selectedUMLClass) {
      console.warn('[ELIMINAR CLASE] ⚠️ No hay clase seleccionada');
      return;
    }
    
    console.log('[ELIMINAR CLASE] 🗑️ INICIANDO ELIMINACIÓN LOCAL');
    console.log('[ELIMINAR CLASE] 🗑️ ClassId:', this.selectedUMLClass.id);
    console.log('[ELIMINAR CLASE] 🗑️ Nombre de la clase:', this.selectedUMLClass.name);
    
    const classToDelete = this.selectedUMLClass.id;
    
    try {
      // 1. Eliminar relaciones que usan esta clase
      console.log('[ELIMINAR CLASE] 🗑️ Eliminando relaciones relacionadas...');
      const relationsToDelete = this.umlRelations.filter(
        rel => rel.sourceId === classToDelete || rel.targetId === classToDelete
      );
      
      console.log('[ELIMINAR CLASE] 🗑️ Relaciones a eliminar:', relationsToDelete.length);
      relationsToDelete.forEach(rel => {
        console.log('[ELIMINAR CLASE] 🗑️ Eliminando relación:', rel.id);
        
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
      console.log('[ELIMINAR CLASE] 🗑️ Eliminando clase del array UML...');
      const classIndex = this.umlClasses.findIndex(c => c.id === classToDelete);
      if (classIndex !== -1) {
        console.log('[ELIMINAR CLASE] 🗑️ Clase eliminada:', this.umlClasses[classIndex]);
        this.umlClasses.splice(classIndex, 1);
      }
      
      // 3. Eliminar nodo visual
      console.log('[ELIMINAR CLASE] 🗑️ Eliminando nodo visual...');
      const nodeIndex = this.nodes.findIndex(n => n.id === classToDelete);
      if (nodeIndex !== -1) {
        console.log('[ELIMINAR CLASE] 🗑️ Nodo eliminado:', this.nodes[nodeIndex]);
        this.nodes.splice(nodeIndex, 1);
      }
      
      // 4. Eliminar del diagrama visual
      if (this.diagramComponent) {
        const nodeObj = this.diagramComponent.getNodeObject(classToDelete);
        if (nodeObj) {
          console.log('[ELIMINAR CLASE] 🎨 Eliminando nodo del diagrama visual');
          this.diagramComponent.remove(nodeObj);
        }
        
        // Actualizar referencias de arrays para sincronización
        this.diagramComponent.nodes = [...this.nodes];
        this.diagramComponent.connectors = [...this.connectors];
        
        console.log('[ELIMINAR CLASE] 🎨 Actualizando diagrama visual...');
        this.diagramComponent.dataBind();
        this.diagramComponent.refresh();
        console.log('[ELIMINAR CLASE] ✅ Diagrama actualizado visualmente');
      }
      
      // 5. Auto-guardar cambios localmente
      console.log('[ELIMINAR CLASE] 💾 Guardando eliminación automáticamente');
      this.autoSaveDiagram();
      
      // 6. Emitir evento colaborativo
      console.log('[ELIMINAR CLASE] 📤 ENVIANDO EVENTO COLABORATIVO');
      if (this.collabComp && this.collabComp.sendEvent) {
        this.collabComp.sendEvent({
          type: 'delete_class',
          diagramId: this.diagramId,
          payload: { classId: classToDelete }
        });
        console.log('[ELIMINAR CLASE] ✅ Evento colaborativo enviado');
      } else {
        console.error('[ELIMINAR CLASE] ❌ No se pudo enviar evento colaborativo');
      }
      
      // 7. Limpiar selección
      this.selectedUMLClass = null;
      console.log('[ELIMINAR CLASE] ✅ ELIMINACIÓN LOCAL COMPLETADA');
      
    } catch (error) {
      console.error('[ELIMINAR CLASE] 💥 Error durante eliminación:', error);
    }
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
        
        // Actualizar referencias de arrays para sincronización
        this.diagramComponent.nodes = [...this.diagramComponent.nodes];
        if (this.diagramComponent.connectors) {
          this.diagramComponent.connectors = [...this.connectors];
        }
        
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
    console.log('🔍 [AFTER-VIEW-INIT] ngAfterViewInit ejecutado');
    console.log('🔍 [AFTER-VIEW-INIT] collabComp disponible:', !!this.collabComp);
    console.log('🔍 [AFTER-VIEW-INIT] diagramComponent disponible:', !!this.diagramComponent);
    
    if (this.collabComp) {
      console.log('🔍 [AFTER-VIEW-INIT] ✅ Componente de colaboración inicializado correctamente');
      console.log('🔍 [AFTER-VIEW-INIT] sendEvent disponible:', !!this.collabComp.sendEvent);
      console.log('🔍 [AFTER-VIEW-INIT] Estado de colaboración:', this.collabComp);
      
      // Verificar conexión después de un breve delay
      setTimeout(() => {
        console.log('🔍 [AFTER-VIEW-INIT] Verificación tardía del componente colaborativo');
        console.log('🔍 [AFTER-VIEW-INIT] collabComp después de timeout:', !!this.collabComp);
        console.log('🔍 [AFTER-VIEW-INIT] sendEvent después de timeout:', !!this.collabComp?.sendEvent);
      }, 2000);
    } else {
      console.error('🔍 [AFTER-VIEW-INIT] ❌ Componente de colaboración NO está disponible');
      
      // Verificar nuevamente después de un delay por si el componente se inicializa tarde
      setTimeout(() => {
        console.log('🔍 [AFTER-VIEW-INIT] Verificación tardía del componente colaborativo');
        console.log('🔍 [AFTER-VIEW-INIT] collabComp después de timeout:', !!this.collabComp);
        if (this.collabComp) {
          console.log('🔍 [AFTER-VIEW-INIT] ✅ Componente colaborativo ahora disponible');
          console.log('🔍 [AFTER-VIEW-INIT] sendEvent disponible:', !!this.collabComp.sendEvent);
        } else {
          console.error('🔍 [AFTER-VIEW-INIT] ❌ Componente colaborativo sigue sin estar disponible');
        }
      }, 2000);
    }
    
    // Agregar funciones de debugging global para consola del navegador
    (window as any).diagramDebug = {
      testMovement: () => {
        console.log('🧪 [TEST] Simulando movimiento de primer nodo...');
        if (this.nodes.length > 0) {
          const testNode = this.nodes[0];
          console.log('🧪 [TEST] Nodo a mover:', testNode.id);
          
          // Simular evento de movimiento
          const fakeEvent = {
            element: {
              id: testNode.id,
              offsetX: (testNode.offsetX || 0) + 50,
              offsetY: (testNode.offsetY || 0) + 50
            }
          };
          
          console.log('🧪 [TEST] Llamando onElementMoved...');
          this.onElementMoved(fakeEvent);
        } else {
          console.log('🧪 [TEST] No hay nodos para mover');
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
        console.log('🧪 [TEST] Forzando disparo de propertyChange...');
        if (this.diagramComponent && this.nodes.length > 0) {
          const testNode = this.nodes[0];
          // Intentar obtener el nodo del diagrama y modificar su posición
          const diagramNode = this.diagramComponent.getNodeObject(testNode.id!);
          if (diagramNode) {
            console.log('🧪 [TEST] Nodo encontrado en diagrama, modificando posición...');
            // Forzar un cambio pequeño
            diagramNode.offsetX = (diagramNode.offsetX || 0) + 1;
            this.diagramComponent.dataBind();
            this.diagramComponent.refresh();
          }
        }
      }
    };
    
    console.log('🔍 [AFTER-VIEW-INIT] ✅ Funciones de debug agregadas a window.diagramDebug');
    console.log('🔍 [AFTER-VIEW-INIT] Funciones disponibles:');
    console.log('  - window.diagramDebug.testMovement() // Simula movimiento');
    console.log('  - window.diagramDebug.getState() // Estado actual');
    console.log('  - window.diagramDebug.forcePropertyChange() // Fuerza evento');
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