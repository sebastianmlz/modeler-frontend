import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../../core/ai.service';
import { PdfService } from '../../../core/pdf.service';

@Component({
  selector: 'app-diagram-export-manual',
  imports: [CommonModule],
  templateUrl: './diagram-export-manual.component.html',
  styleUrl: './diagram-export-manual.component.css'
})
export class DiagramExportManualComponent {
  @Input() backendCode: string = '';
  @Input() projectName: string = '';

  manualText = '';
  loading = false;
  error = '';

  constructor(
    private aiService: AiService,
    private pdfService: PdfService
  ) {}

  generateManual(): void {
    if (!this.backendCode.trim()) {
      this.error = 'No hay código backend para generar el manual.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.manualText = '';

    // Usar el nuevo método especializado del servicio
    this.aiService.generateTechnicalDocumentation(this.backendCode, this.projectName).subscribe({
      next: (documentation) => {
        this.manualText = documentation;
        this.loading = false;
        console.log('📖 Documentación técnica generada exitosamente');
      },
      error: (err) => {
        console.error('Error al generar documentación:', err);
        this.error = 'Error al generar la documentación: ' + (err?.error?.error?.message || err?.message || err);
        this.loading = false;
      }
    });
  }

  async downloadAsPdf(): Promise<void> {
    if (!this.manualText.trim()) {
      this.error = 'No hay manual generado para descargar.';
      return;
    }
    
    try {
      this.loading = true;
      this.error = '';
      const fileName = `${this.projectName || 'Manual'}-Documentation.pdf`;
      await this.pdfService.generatePdfFromMarkdown(this.manualText, fileName);
    } catch (error) {
      this.error = 'Error al generar el PDF: ' + (error instanceof Error ? error.message : error);
    } finally {
      this.loading = false;
    }
  }
}
