
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-show-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-sidebar.component.html',
  styleUrl: './show-sidebar.component.css'
})
export class ShowSidebarComponent {
  @Output() addClass = new EventEmitter<{ name: string; type: string }>();
  @Output() addRelation = new EventEmitter<{ name: string; type: string }>();

  showClasses = false;
  showRelations = false;

  umlClasses = [
    { name: 'Clase Usuario', type: 'user' },
    { name: 'Clase Proyecto', type: 'project' },
    { name: 'Clase Organización', type: 'organization' }
  ];

  umlRelations = [
    { name: 'Herencia', type: 'inheritance' },
    { name: 'Asociación', type: 'association' },
    { name: 'Dependencia', type: 'dependency' }
  ];

  toggleClasses() {
    this.showClasses = !this.showClasses;
    if (this.showClasses) this.showRelations = false;
  }

  toggleRelations() {
    this.showRelations = !this.showRelations;
    if (this.showRelations) this.showClasses = false;
  }

  selectClass(cls: { name: string; type: string }) {
    this.addClass.emit(cls);
  }

  selectRelation(rel: { name: string; type: string }) {
    this.addRelation.emit(rel);
  }
}
