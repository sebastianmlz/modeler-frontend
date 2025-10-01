import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Sidebar item interface for UML elements
 */
interface SidebarItem {
  type: 'class' | 'relation';
  name: string;
  icon: string;
}

@Component({
  selector: 'app-show-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-sidebar.component.html',
  styleUrl: './show-sidebar.component.css'
})
export class ShowSidebarComponent {
  @Output() addClass = new EventEmitter<string>();
  @Output() selectRelation = new EventEmitter<string>();

  // UI state
  selectedRelation: string = '';

  umlItems: SidebarItem[] = [
    {
      type: 'class',
      name: 'Clase',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="30" height="18" rx="2" fill="#fff" stroke="#222" stroke-width="2"/><rect x="3" y="5" width="30" height="5" fill="#e5e7eb" stroke="#222" stroke-width="1"/><text x="18" y="15" text-anchor="middle" font-size="10" fill="#222" font-family="Arial">Clase</text></svg>`
    },
    {
      type: 'class',
      name: 'Interface',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="30" height="18" rx="2" fill="#fff" stroke="#222" stroke-width="2"/><rect x="3" y="5" width="30" height="5" fill="#e8f4fd" stroke="#222" stroke-width="1"/><text x="18" y="11" text-anchor="middle" font-size="8" fill="#222" font-family="Arial">«interface»</text><text x="18" y="18" text-anchor="middle" font-size="9" fill="#222" font-family="Arial">Interface</text></svg>`
    },
    {
      type: 'class',
      name: 'Clase Abstracta',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="30" height="18" rx="2" fill="#fff" stroke="#222" stroke-width="2"/><rect x="3" y="5" width="30" height="5" fill="#fef3e8" stroke="#222" stroke-width="1"/><text x="18" y="11" text-anchor="middle" font-size="8" fill="#222" font-family="Arial">«abstract»</text><text x="18" y="18" text-anchor="middle" font-size="8" fill="#222" font-family="Arial">ClaseAbstracta</text></svg>`
    }
  ];
  relationItems: SidebarItem[] = [
    {
      type: 'relation',
      name: 'Herencia',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="22" x2="18" y2="10" stroke="#222" stroke-width="2"/><polygon points="18,6 14,10 22,10" fill="#fff" stroke="#222" stroke-width="2"/></svg>`
    },
    {
      type: 'relation',
      name: 'Asociación',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="8" y1="14" x2="28" y2="14" stroke="#222" stroke-width="2"/><polygon points="28,14 24,12 28,16" fill="#222"/></svg>`
    },
    {
      type: 'relation',
      name: 'Agregación',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="8" y1="14" x2="28" y2="14" stroke="#222" stroke-width="2"/><polygon points="28,14 24,12 22,14 24,16" fill="#fff" stroke="#222" stroke-width="2"/></svg>`
    },
    {
      type: 'relation',
      name: 'Composición',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="8" y1="14" x2="28" y2="14" stroke="#222" stroke-width="2"/><polygon points="28,14 24,12 22,14 24,16" fill="#222" stroke="#222" stroke-width="2"/></svg>`
    },
    {
      type: 'relation',
      name: 'Dependencia',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="8" y1="14" x2="28" y2="14" stroke="#222" stroke-width="2" stroke-dasharray="4 2"/><polygon points="28,14 24,12 28,16" fill="#222"/></svg>`
    },
    {
      type: 'relation',
      name: 'Realización',
      icon: `<svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="8" y1="14" x2="28" y2="14" stroke="#222" stroke-width="2" stroke-dasharray="4 2"/><polygon points="28,14 24,12 22,14 24,16" fill="#fff" stroke="#222" stroke-width="2"/></svg>`
    }
  ];

  /**
   * Handle UML item click events
   */
  onUmlItemClick(item: SidebarItem): void {
    if (item.type === 'class') {
      this.addClass.emit(item.name);
    }
  }

  /**
   * Handle relation selection
   */
  onRelationClick(item: SidebarItem): void {
    this.selectedRelation = item.name;
    this.selectRelation.emit(item.name);
  }
}
