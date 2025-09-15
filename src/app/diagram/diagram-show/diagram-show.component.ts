import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DiagramVersionService } from './diagram-version.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShowSidebarComponent } from './show-sidebar/show-sidebar.component';
import * as joint from '@joint/core';


// ...existing code...

@Component({
  selector: 'app-diagram-show',
  standalone: true,
  imports: [CommonModule, FormsModule, ShowSidebarComponent],
  templateUrl: './diagram-show.component.html',
  styleUrl: './diagram-show.component.css'
})
export class DiagramShowComponent implements OnInit {
  diagramId: string = '';
  versionId: string = '';
  savingVersion: boolean = false;
  saveError: string = '';
  loadingVersion: boolean = false;
  loadError: string = '';

  constructor(
    private route: ActivatedRoute,
    private versionService: DiagramVersionService
  ) {}
  // Devuelve true si ya existe un atributo PK en la lista
  hasPrimaryKey(): boolean {
    return this.editClassAttrs.some(attr => attr.isPrimaryKey);
  }

  // Devuelve true si el atributo actual debe tener el checkbox PK deshabilitado
  isPrimaryKeyDisabled(index: number): boolean {
    return this.editClassAttrs.some((attr, i) => attr.isPrimaryKey && i !== index);
  }
  @ViewChild('diagramCanvas', { static: true }) diagramCanvas!: ElementRef<HTMLDivElement>;
  graph!: joint.dia.Graph;
  paper!: joint.dia.Paper;
  relationMode: { active: boolean; type?: string; name?: string } = { active: false };
  selectedClasses: joint.dia.Element[] = [];



    logSnapshot(): void {
      if (!this.graph) return;
      const classes: Record<string, any> = {};
      const relations: Record<string, any> = {};
      this.graph.getElements().forEach((el: joint.dia.Element, idx: number) => {
        if (el instanceof joint.shapes.standard.Rectangle) {
          const id = el.id || `C${idx+1}`;
          const name = el.attr('label/text') || '';
          const position = el.position();
          const size = el.size();
          // Leer atributos completos desde attrs/json
          let attributes: any[] = [];
          const attrsJson = el.attr('attrs/json');
          if (attrsJson) {
            try {
              attributes = JSON.parse(attrsJson).map((attr: any, i: number) => ({
                id: `A${id}-${i+1}`,
                ...attr
              }));
            } catch {
              attributes = [];
            }
          }
          classes[id] = {
            id,
            name,
            visibility: 'PUBLIC',
            position: { x: position.x, y: position.y },
            size: { w: size.width, h: size.height },
            attributes
          };
        }
      });
      this.graph.getLinks().forEach((link: joint.dia.Link, idx: number) => {
        const id = link.id || `R${idx+1}`;
        const source = (link.get('source') as any).id;
        const target = (link.get('target') as any).id;
        // Leer tipo de relación desde el atributo 'relationType' si existe, si no usar heurística
        let type = link.attr('relationType');
        if (!type) {
          // Heurística visual (puedes mejorar esto para soportar más tipos)
          const stroke = link.attr('line/stroke');
          if (stroke === '#f59e42') type = 'INHERITANCE';
          else if (stroke === '#14b8a6') type = 'ASSOCIATION';
          else type = 'ASSOCIATION';
        }
        relations[id] = {
          id,
          source,
          target,
          type,
          label: link.attr('label/text') || ''
        };
      });
      const snapshot = {
        classes,
        relations,
        enums: {},
        metadata: {}
      };
      console.log('Snapshot generado:', snapshot);
    }
// ...existing code...
  onAddRelation(rel: { name: string; type: string }) {
    // Activar modo de selección de clases para crear relación
    this.relationMode = { active: true, type: rel.type, name: rel.name };
    this.selectedClasses = [];
    // Opcional: mostrar mensaje visual de selección
    alert(`Selecciona dos clases en el canvas para crear la relación: ${rel.name}`);
  }

  createRelation(source: joint.dia.Element, target: joint.dia.Element, rel: { type?: string; name?: string }) {
    // Crear una relación UML básica (enlace) entre dos clases
    const link = new joint.shapes.standard.Link();
    link.source({ id: source.id });
    link.target({ id: target.id });
    link.attr({
      line: {
        stroke: rel.type === 'inheritance' ? '#f59e42' : '#14b8a6',
        strokeWidth: 3,
        targetMarker: {
          'type': rel.type === 'inheritance' ? 'path' : 'classic',
          'd': rel.type === 'inheritance' ? 'M 10 -5 0 0 10 5 Z' : 'M 10 -5 0 0 10 5 Z',
          'fill': rel.type === 'inheritance' ? '#f59e42' : '#14b8a6'
        }
      },
      label: {
        text: rel.name || '',
        fill: '#374151',
        fontSize: 14,
        fontWeight: 'bold',
        textAnchor: 'middle',
        y: -10
      }
    });
    this.graph.addCell(link);
  }

  ngOnInit(): void {
    this.graph = new joint.dia.Graph();
    // Obtener el id del diagrama y version desde la ruta y query params
    const paramId = this.route.snapshot.paramMap.get('id');
    const paramVersionId = this.route.snapshot.paramMap.get('versionId');
    const queryDiagram = this.route.snapshot.queryParamMap.get('diagram');
    const queryVersionId = this.route.snapshot.queryParamMap.get('versionId');
    this.diagramId = paramId || queryDiagram || '';
    this.versionId = paramVersionId || queryVersionId || '';
    console.log('ngOnInit diagramId:', this.diagramId);
    console.log('ngOnInit versionId:', this.versionId);
    if (this.versionId) {
      this.loadVersion(this.versionId);
    }
  }

  loadVersion(versionId: string): void {
    this.loadingVersion = true;
    this.loadError = '';
    this.versionService.getVersion(versionId).subscribe({
      next: (res) => {
        console.log('Respuesta GET versión:', res);
        this.loadingVersion = false;
        if (res.snapshot) {
          this.renderSnapshot(res.snapshot);
        } else {
          this.loadError = 'La versión no contiene snapshot.';
        }
      },
      error: () => {
        this.loadingVersion = false;
        this.loadError = 'Error al cargar la versión.';
      }
    });
  }

  renderSnapshot(snapshot: any): void {
    if (!snapshot) {
      this.loadError = 'No se recibió snapshot para restaurar.';
      return;
    }
    this.graph.clear();
    // Renderizar clases (asegura array)
    const classesArr = Array.isArray(snapshot.classes) ? snapshot.classes : Object.values(snapshot.classes || {});
  // Mapeo de IDs: snapshot → JointJS
  const idMap: Record<any, string> = {};
    classesArr.forEach((cls: any) => {
      const baseHeight = 32;
      const attrHeight = 24 * Math.max(1, (cls.attributes?.length || 1));
      const totalHeight = baseHeight + attrHeight;
      const umlClass = new joint.shapes.standard.Rectangle({
        markup: [
          { tagName: 'rect', selector: 'body' },
          { tagName: 'rect', selector: 'nameBg' },
          { tagName: 'rect', selector: 'attrsBg' },
          { tagName: 'text', selector: 'label' },
          { tagName: 'text', selector: 'attrs' },
        ]
      });
      umlClass.position(cls.position.x, cls.position.y);
      umlClass.resize(cls.size.w, cls.size.h);
      umlClass.attr({
        body: {
          fill: '#6366f1',
          stroke: '#312e81',
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          width: cls.size.w,
          height: cls.size.h,
        },
        nameBg: {
          x: 0,
          y: 0,
          width: cls.size.w,
          height: baseHeight,
          fill: '#6366f1',
          stroke: 'none',
        },
        attrsBg: {
          x: 0,
          y: baseHeight,
          width: cls.size.w,
          height: attrHeight,
          fill: '#e0e7ff',
          stroke: 'none',
        },
        label: {
          text: cls.name,
          x: cls.size.w / 2,
          y: baseHeight / 2 + 4,
          textAnchor: 'middle',
          fontSize: 18,
          fontWeight: 'bold',
          fill: '#fff',
        },
        attrs: {
          text: (cls.attributes || []).map((a: any) => a.name).join('\n'),
          x: cls.size.w / 2,
          y: baseHeight + 18,
          textAnchor: 'middle',
          fontSize: 14,
          fontWeight: 'normal',
          fill: '#312e81',
        }
      });
      umlClass.attr('attrs/json', JSON.stringify(cls.attributes || []));
      umlClass.attr('attrs/text', (cls.attributes || []).map((a: any) => a.name).join('\n'));
      umlClass.attr('label/text', cls.name);
      this.graph.addCell(umlClass);
  idMap[cls.id as string] = String(umlClass.id);
    });
    // Renderizar relaciones (asegura array)
    const relationsArr = Array.isArray(snapshot.relations) ? snapshot.relations : Object.values(snapshot.relations || {});
    relationsArr.forEach((rel: any) => {
      // Usar el idMap para obtener los IDs reales
      const sourceId = idMap[rel.source];
      const targetId = idMap[rel.target];
      const sourceElement = this.graph.getCell(sourceId);
      const targetElement = this.graph.getCell(targetId);
      if (sourceElement && targetElement) {
        const link = new joint.shapes.standard.Link();
        link.source({ id: sourceId });
        link.target({ id: targetId });
        link.attr({
          line: {
            stroke: rel.type === 'INHERITANCE' ? '#f59e42' : '#14b8a6',
            strokeWidth: 3,
            targetMarker: {
              'type': rel.type === 'INHERITANCE' ? 'path' : 'classic',
              'd': rel.type === 'INHERITANCE' ? 'M 10 -5 0 0 10 5 Z' : 'M 10 -5 0 0 10 5 Z',
              'fill': rel.type === 'INHERITANCE' ? '#f59e42' : '#14b8a6'
            }
          },
          label: {
            text: rel.label || '',
            fill: '#374151',
            fontSize: 14,
            fontWeight: 'bold',
            textAnchor: 'middle',
            y: -10
          }
        });
        link.id = rel.id;
        this.graph.addCell(link);
      } else {
        console.warn('No se encontró elemento fuente o destino para la relación:', rel);
      }
    });
    this.loadError = '';
  }

  saveVersion(): void {
    if (!this.diagramId) {
      this.saveError = 'No se encontró el ID del diagrama.';
      return;
    }
    if (!this.graph) {
      this.saveError = 'No hay diagrama para guardar.';
      return;
    }
    this.savingVersion = true;
    this.saveError = '';
    // Generar snapshot
    const classes: Record<string, any> = {};
    const relations: Record<string, any> = {};
    this.graph.getElements().forEach((el: joint.dia.Element, idx: number) => {
      if (el instanceof joint.shapes.standard.Rectangle) {
        const id = el.id || `C${idx+1}`;
        const name = el.attr('label/text') || '';
        const position = el.position();
        const size = el.size();
        let attributes: any[] = [];
        const attrsJson = el.attr('attrs/json');
        if (attrsJson) {
          try {
            attributes = JSON.parse(attrsJson).map((attr: any, i: number) => ({
              id: `A${id}-${i+1}`,
              ...attr
            }));
          } catch {
            attributes = [];
          }
        }
        classes[id] = {
          id,
          name,
          visibility: 'PUBLIC',
          position: { x: position.x, y: position.y },
          size: { w: size.width, h: size.height },
          attributes
        };
      }
    });
    this.graph.getLinks().forEach((link: joint.dia.Link, idx: number) => {
      const id = link.id || `R${idx+1}`;
      const source = (link.get('source') as any).id;
      const target = (link.get('target') as any).id;
      let type = link.attr('relationType');
      if (!type) {
        const stroke = link.attr('line/stroke');
        if (stroke === '#f59e42') type = 'INHERITANCE';
        else if (stroke === '#14b8a6') type = 'ASSOCIATION';
        else type = 'ASSOCIATION';
      }
      relations[id] = {
        id,
        source,
        target,
        type,
        label: link.attr('label/text') || ''
      };
    });
    const snapshot = {
      classes: Object.values(classes),
      relations: Object.values(relations),
      enums: {},
      metadata: {}
    };
    // Llamar al servicio para guardar la versión
    this.versionService.createVersion(this.diagramId, snapshot, 'Versión guardada desde el editor').subscribe({
      next: (res) => {
        this.savingVersion = false;
        alert('Versión guardada correctamente.');
      },
      error: (err) => {
        this.savingVersion = false;
        this.saveError = 'Error al guardar la versión.';
      }
    });
  }

  ngAfterViewInit(): void {
    this.paper = new joint.dia.Paper({
      el: this.diagramCanvas.nativeElement,
      model: this.graph,
      width: this.diagramCanvas.nativeElement.offsetWidth,
      height: this.diagramCanvas.nativeElement.offsetHeight,
      gridSize: 10,
      drawGrid: true,
      background: { color: '#f3f4f6' }
    });

    // Handler para relaciones
    this.paper.on('element:pointerdown', (elementView: any) => {
      if (!this.relationMode.active) return;
      const element = elementView.model as joint.dia.Element;
      if (element.isElement()) {
        // Evitar seleccionar el mismo dos veces
        if (this.selectedClasses.length === 0 || this.selectedClasses[0].id !== element.id) {
          this.selectedClasses.push(element);
        }
        if (this.selectedClasses.length === 2) {
          this.createRelation(this.selectedClasses[0], this.selectedClasses[1], this.relationMode);
          this.relationMode = { active: false };
          this.selectedClasses = [];
        }
      }
    });

    // Handler para edición de clase UML
    this.paper.on('element:pointerdblclick', (elementView: any) => {
      const element = elementView.model as joint.dia.Element;
      if (element.isElement()) {
        this.openEditClassModal(element);
      }
    });
  }

  // Modal de edición (lógica inicial)
  editingClass: joint.dia.Element | null = null;
  showEditModal = false;
  editClassName = '';
  editClassAttrs: Array<{ name: string; typeName: string; isPrimaryKey: boolean; isRequired: boolean; position: number }> = [];
  newAttr: { name: string; typeName: string; isPrimaryKey: boolean; isRequired: boolean } = { name: '', typeName: 'String', isPrimaryKey: false, isRequired: false };

  openEditClassModal(element: joint.dia.Element) {
    this.editingClass = element;
    this.editClassName = element.attr('label/text') || '';
    // Leer atributos guardados en el elemento (como JSON, si existe)
    const attrsJson = element.attr('attrs/json') || '';
    if (attrsJson) {
      try {
        this.editClassAttrs = JSON.parse(attrsJson);
      } catch {
        this.editClassAttrs = [];
      }
    } else {
      // Si no hay JSON, intentar migrar desde texto plano
      const attrsText = element.attr('attrs/text') || '';
  this.editClassAttrs = attrsText ? attrsText.split('\n').map((name: string, i: number) => ({ name, typeName: 'String', isPrimaryKey: i === 0, isRequired: false, position: i })) : [];
    }
    this.newAttr = { name: '', typeName: 'String', isPrimaryKey: false, isRequired: false };
    this.showEditModal = true;
  }

  saveEditClass() {
    if (this.editingClass) {
      this.editingClass.attr('label/text', this.editClassName);
      // Guardar atributos como JSON y como texto plano para compatibilidad visual
      this.editClassAttrs.forEach((attr, i) => attr.position = i);
      this.editingClass.attr('attrs/json', JSON.stringify(this.editClassAttrs));
      const attrsText = this.editClassAttrs.map(attr => attr.name).join('\n');
      this.editingClass.attr('attrs/text', attrsText);
      // Calcular altura dinámica
      const baseHeight = 32; // altura del nombre
      const attrHeight = 24 * Math.max(1, this.editClassAttrs.length); // 24px por atributo
      const totalHeight = baseHeight + attrHeight;
      this.editingClass.resize(160, totalHeight);
      // Actualizar markup personalizado
      this.editingClass.markup = [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'nameBg' },
        { tagName: 'rect', selector: 'attrsBg' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'text', selector: 'attrs' },
      ];
      this.editingClass.attr({
        body: {
          fill: '#6366f1',
          stroke: '#312e81',
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          width: 160,
          height: totalHeight,
        },
        nameBg: {
          x: 0,
          y: 0,
          width: 160,
          height: baseHeight,
          fill: '#6366f1',
          stroke: 'none',
        },
        attrsBg: {
          x: 0,
          y: baseHeight,
          width: 160,
          height: attrHeight,
          fill: '#e0e7ff',
          stroke: 'none',
        },
        label: {
          text: this.editClassName,
          x: 80,
          y: baseHeight / 2 + 4,
          textAnchor: 'middle',
          fontSize: 18,
          fontWeight: 'bold',
          fill: '#fff',
        },
        attrs: {
          text: attrsText,
          x: 80,
          y: baseHeight + 18,
          textAnchor: 'middle',
          fontSize: 14,
          fontWeight: 'normal',
          fill: '#312e81',
        }
      });
    }
    this.showEditModal = false;
    this.editingClass = null;
  }

  onAddClass(cls: { name: string; type: string }) {
    // Crear un elemento UML tipo clase en el centro del canvas
    const width = typeof this.paper?.options?.width === 'number' ? this.paper.options.width : 900;
    const height = typeof this.paper?.options?.height === 'number' ? this.paper.options.height : 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseHeight = 32;
    const attrHeight = 24; // 1 atributo por defecto
    const totalHeight = baseHeight + attrHeight;
    const umlClass = new joint.shapes.standard.Rectangle({
      markup: [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'nameBg' },
        { tagName: 'rect', selector: 'attrsBg' },
        { tagName: 'text', selector: 'label' },
        { tagName: 'text', selector: 'attrs' },
      ]
    });
    umlClass.position(centerX - 80, centerY - totalHeight / 2);
    umlClass.resize(160, totalHeight);
    umlClass.attr({
      body: {
        fill: '#6366f1',
        stroke: '#312e81',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        width: 160,
        height: totalHeight,
      },
      nameBg: {
        x: 0,
        y: 0,
        width: 160,
        height: baseHeight,
        fill: '#6366f1',
        stroke: 'none',
      },
      attrsBg: {
        x: 0,
        y: baseHeight,
        width: 160,
        height: attrHeight,
        fill: '#e0e7ff',
        stroke: 'none',
      },
      label: {
        text: cls.name,
        x: 80,
        y: baseHeight / 2 + 4,
        textAnchor: 'middle',
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#fff',
      },
      attrs: {
        text: '',
        x: 80,
        y: baseHeight + 18,
        textAnchor: 'middle',
        fontSize: 14,
        fontWeight: 'normal',
        fill: '#312e81',
      }
    });
    umlClass.attr('attrs/json', JSON.stringify([]));
    this.graph.addCell(umlClass);
  }

  addNewAttribute() {
    if (!this.newAttr.name) return;
    this.editClassAttrs.push({
      name: this.newAttr.name,
      typeName: this.newAttr.typeName,
      isPrimaryKey: this.newAttr.isPrimaryKey,
      isRequired: this.newAttr.isRequired,
      position: this.editClassAttrs.length
    });
    // Limpiar el campo de nuevo atributo y desmarcar PK si ya existe uno
    this.newAttr = { name: '', typeName: 'String', isPrimaryKey: false, isRequired: false };
  }
}
