import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService, UMLSuggestion, UMLSuggestionsResponse } from '../../../core/ai.service';

// Interfaz para la respuesta de comando por voz
export interface VoiceCommandResponse {
  success: boolean;
  message: string;
  changes: UMLSuggestionsResponse;
  recognizedText: string;
}

@Component({
  selector: 'app-diagram-ai-prompt',
  imports: [CommonModule],
  templateUrl: './diagram-ai-prompt.component.html',
  styleUrl: './diagram-ai-prompt.component.css'
})
export class DiagramAiPromptComponent implements OnInit, OnDestroy {
  
  @Input() diagramSnapshot: any = null;
  @Output() applyVoiceCommand = new EventEmitter<UMLSuggestionsResponse>();

  // Estados del componente
  isListening: boolean = false;
  isProcessing: boolean = false;
  error: string = '';
  lastRecognizedText: string = '';
  lastResponse: VoiceCommandResponse | null = null;
  
  // Feedback visual
  successMessage: string = '';
  showSuccess: boolean = false;
  
  // Variables para captura de audio
  private recognition: any = null; // SpeechRecognition API
  
  private successTimeout?: any;

  constructor(private aiService: AiService) {}

  ngOnInit(): void {
    this.initializeSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.cleanup();
    
    // Limpiar timeout de éxito si existe
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  /**
   * Inicializa la API de reconocimiento de voz del navegador
   */
  private initializeSpeechRecognition(): void {
    // Verificar soporte del navegador
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.error = 'Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES'; // Español

    this.recognition.onstart = () => {
      this.isListening = true;
      this.error = '';
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        this.lastRecognizedText = finalTranscript.trim();
      }
    };

    this.recognition.onerror = (event: any) => {
      this.error = `Error de reconocimiento: ${event.error}`;
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      
      if (this.lastRecognizedText && !this.isProcessing) {
        this.processVoiceCommand();
      }
    };
  }

  /**
   * Inicia la captura de audio
   */
  startListening(): void {
    if (!this.recognition) {
      this.error = 'Reconocimiento de voz no disponible';
      return;
    }

    if (this.isListening) {
      return;
    }

    this.lastRecognizedText = '';
    this.error = '';
    this.lastResponse = null;
    
    try {
      this.recognition.start();
    } catch (error) {
      this.error = 'Error al iniciar el reconocimiento de voz';
    }
  }

  /**
   * Detiene la captura de audio
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Procesa el comando de voz reconocido
   */
  private processVoiceCommand(): void {
    if (!this.lastRecognizedText || !this.diagramSnapshot) {
      return;
    }

    this.isProcessing = true;
    this.error = '';

    this.aiService.processVoiceCommand(this.diagramSnapshot, this.lastRecognizedText)
      .subscribe({
        next: (response: UMLSuggestionsResponse) => {
          this.lastResponse = {
            success: true,
            message: response.summary || 'Comando procesado exitosamente',
            changes: response,
            recognizedText: this.lastRecognizedText
          };
          
          this.isProcessing = false;
          
          this.showSuccessFeedback(`Comando ejecutado: "${this.lastRecognizedText}"`);
        },
        error: () => {
          this.error = 'Error procesando el comando. Inténtalo de nuevo.';
          this.isProcessing = false;
        }
      });
  }

  /**
   * Aplica los cambios sugeridos por el comando de voz
   */
  applyChanges(): void {
    if (!this.lastResponse || !this.lastResponse.success) {
      return;
    }

    this.applyVoiceCommand.emit(this.lastResponse.changes);
    
    // Limpiar respuesta después de aplicar
    this.lastResponse = null;
    this.lastRecognizedText = '';
    
    this.showSuccessFeedback('Cambios aplicados exitosamente');
  }

  /**
   * Descarta los cambios sugeridos
   */
  discardChanges(): void {
    this.lastResponse = null;
    this.lastRecognizedText = '';
    this.showSuccessFeedback('Cambios descartados');
  }

  /**
   * Muestra un mensaje de éxito temporal
   */
  private showSuccessFeedback(message: string): void {
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

  /**
   * Limpia recursos y detiene grabación
   */
  private cleanup(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Verifica si hay cambios para aplicar
   */
  hasChangesToApply(): boolean {
    return !!(this.lastResponse?.success && 
           this.lastResponse.changes.suggestions.length > 0);
  }

  /**
   * Obtiene el estado actual para mostrar en la UI
   */
  getCurrentStatus(): string {
    if (this.isListening) return 'Escuchando...';
    if (this.isProcessing) return 'Procesando comando...';
    if (this.hasChangesToApply()) return 'Cambios listos para aplicar';
    if (this.lastRecognizedText) return 'Comando reconocido';
    return 'Listo para escuchar';
  }

  /**
   * Get CSS icon class for current status
   */
  getCurrentStatusIcon(): string {
    if (this.isListening) return 'pi pi-microphone';
    if (this.isProcessing) return 'pi pi-spin pi-spinner';
    if (this.hasChangesToApply()) return 'pi pi-check-circle';
    if (this.error) return 'pi pi-exclamation-triangle';
    return 'pi pi-volume-up';
  }
}
