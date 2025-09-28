import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService, UMLSuggestion, UMLSuggestionsResponse } from '../../../core/ai.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-diagram-ai-suggestions',
  imports: [CommonModule],
  templateUrl: './diagram-ai-suggestions.component.html',
  styleUrl: './diagram-ai-suggestions.component.css'
})
export class DiagramAiSuggestionsComponent implements OnInit, OnDestroy {
  
  @Input() diagramSnapshot: any = null;
  @Input() autoRefreshInterval: number = 15000; // 15 segundos por defecto
  @Output() applySuggestion = new EventEmitter<UMLSuggestion>();
  @Output() applyAllSuggestions = new EventEmitter<UMLSuggestionsResponse>();

  suggestions: UMLSuggestion[] = [];
  isLoading: boolean = false;
  error: string = '';
  summary: string = '';
  lastAnalyzedSnapshot: string = '';
  
  // Feedback visual
  successMessage: string = '';
  showSuccess: boolean = false;
  
  private autoRefreshSubscription?: Subscription;
  private successTimeout?: any;

  constructor(private aiService: AiService) {}

  ngOnInit(): void {
    // Iniciar el análisis automático si hay snapshot
    if (this.diagramSnapshot) {
      this.generateSuggestions();
    }
    
    // Configurar auto-refresh
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    
    // Limpiar timeout de éxito si existe
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  /**
   * Inicia el auto-refresh de sugerencias
   */
  private startAutoRefresh(): void {
    if (this.autoRefreshInterval > 0) {
      this.autoRefreshSubscription = interval(this.autoRefreshInterval).subscribe(() => {
        if (this.shouldRefreshSuggestions()) {
          this.generateSuggestions();
        }
      });
    }
  }

  /**
   * Detiene el auto-refresh
   */
  private stopAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  /**
   * Determina si se deben actualizar las sugerencias
   */
  private shouldRefreshSuggestions(): boolean {
    if (!this.diagramSnapshot) return false;
    
    const currentSnapshotStr = JSON.stringify(this.diagramSnapshot);
    return currentSnapshotStr !== this.lastAnalyzedSnapshot && 
           !this.isLoading && 
           this.hasValidContent();
  }

  /**
   * Verifica si el snapshot tiene contenido válido para analizar
   */
  hasValidContent(): boolean {
    return this.diagramSnapshot && 
           (this.diagramSnapshot.classes?.length > 0 || 
            this.diagramSnapshot.relations?.length > 0);
  }

  /**
   * Genera sugerencias usando la IA
   */
  generateSuggestions(): void {
    if (!this.diagramSnapshot || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.error = '';
    
    this.aiService.generateUMLSuggestions(this.diagramSnapshot).subscribe({
      next: (response: UMLSuggestionsResponse) => {
        this.suggestions = response.suggestions;
        this.summary = response.summary;
        this.lastAnalyzedSnapshot = JSON.stringify(this.diagramSnapshot);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error generando sugerencias:', error);
        this.error = 'Error al generar sugerencias. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Aplica una sugerencia individual
   */
  onApplySuggestion(suggestion: UMLSuggestion): void {
    this.applySuggestion.emit(suggestion);
    
    // Mostrar feedback visual temporal
    this.showSuccessFeedback(`Sugerencia aplicada: ${suggestion.title}`);
  }

  /**
   * Aplica todas las sugerencias
   */
  onApplyAllSuggestions(): void {
    const response: UMLSuggestionsResponse = {
      suggestions: this.suggestions,
      summary: this.summary
    };
    this.applyAllSuggestions.emit(response);
    
    // Mostrar feedback visual temporal
    this.showSuccessFeedback(`${this.suggestions.length} sugerencias aplicadas exitosamente`);
  }

  /**
   * Refresca manualmente las sugerencias (método público para ser llamado externamente)
   */
  public refreshSuggestions(): void {
    this.generateSuggestions();
  }

  /**
   * Obtiene el ícono para cada tipo de sugerencia
   */
  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'attribute': return '🔧';
      case 'relation': return '🔗';
      case 'improvement': return '✨';
      case 'warning': return '⚠️';
      default: return '💡';
    }
  }

  /**
   * Obtiene la clase CSS para cada tipo de sugerencia
   */
  getSuggestionClass(type: string): string {
    switch (type) {
      case 'attribute': return 'suggestion-attribute';
      case 'relation': return 'suggestion-relation';
      case 'improvement': return 'suggestion-improvement';
      case 'warning': return 'suggestion-warning';
      default: return 'suggestion-default';
    }
  }

  /**
   * TrackBy function para optimizar el renderizado de la lista
   */
  trackBySuggestion(index: number, suggestion: UMLSuggestion): string {
    return `${suggestion.type}-${suggestion.target}-${suggestion.title}`;
  }

  /**
   * Obtiene el tiempo de la última actualización
   */
  getLastUpdateTime(): string {
    return new Date().toLocaleTimeString();
  }

  /**
   * Muestra un mensaje de éxito temporal (método público para ser llamado externamente)
   */
  public showSuccessFeedback(message: string): void {
    this.successMessage = message;
    this.showSuccess = true;
    
    // Limpiar timeout anterior si existe
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    
    // Ocultar mensaje después de 3 segundos
    this.successTimeout = setTimeout(() => {
      this.showSuccess = false;
      this.successMessage = '';
    }, 3000);
  }
}
