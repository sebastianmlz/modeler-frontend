import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  /**
   * Genera un PDF a partir de texto en formato markdown
   * @param markdownText - Texto en formato markdown
   * @param fileName - Nombre del archivo PDF a descargar
   */
  async generatePdfFromMarkdown(markdownText: string, fileName: string): Promise<void> {
    try {
      // Importación dinámica de pdfMake
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      
      const pdfMake = pdfMakeModule.default;
      
      // Configurar fuentes usando any para evitar problemas de tipos
      const pdfFonts = pdfFontsModule as any;
      if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
      } else if (pdfFonts.vfs) {
        pdfMake.vfs = pdfFonts.vfs;
      } else if (pdfFonts.default && pdfFonts.default.vfs) {
        pdfMake.vfs = pdfFonts.default.vfs;
      }

      const content = this.parseMarkdownToPdfContent(markdownText);
      
      const docDefinition: any = {
        content: content,
        pageSize: 'A4',
        pageMargins: [60, 80, 60, 60],
        styles: {
          title: {
            fontSize: 24,
            bold: true,
            color: '#1a365d',
            margin: [0, 0, 0, 20],
            alignment: 'center'
          },
          header: {
            fontSize: 18,
            bold: true,
            color: '#2d3748',
            margin: [0, 25, 0, 12],
            borderColor: '#e2e8f0',
            borderWidth: [0, 0, 0, 1]
          },
          subheader: {
            fontSize: 15,
            bold: true,
            color: '#4a5568',
            margin: [0, 18, 0, 8]
          },
          subsubheader: {
            fontSize: 13,
            bold: true,
            color: '#718096',
            margin: [0, 12, 0, 6]
          },
          paragraph: {
            fontSize: 11,
            color: '#2d3748',
            margin: [0, 4, 0, 8],
            lineHeight: 1.4
          },
          code: {
            fontSize: 10,
            fontFamily: 'Courier',
            color: '#d53f8c',
            background: '#f7fafc',
            margin: [2, 1, 2, 1]
          },
          codeblock: {
            fontSize: 10,
            fontFamily: 'Courier',
            color: '#2d3748',
            margin: [8, 8, 8, 8],
            lineHeight: 1.2
          },
          tableHeader: {
            fontSize: 11,
            bold: true,
            color: '#1a365d',
            fillColor: '#edf2f7',
            margin: [6, 8, 6, 8],
            alignment: 'center'
          },
          tableCell: {
            fontSize: 10,
            color: '#4a5568',
            margin: [6, 6, 6, 6],
            lineHeight: 1.4,
            alignment: 'left'
          },
          listItem: {
            fontSize: 11,
            color: '#2d3748',
            margin: [0, 3, 0, 3],
            lineHeight: 1.3
          },
          emphasis: {
            fontSize: 11,
            color: '#3182ce',
            italics: true,
            margin: [0, 4, 0, 4]
          },
          apiEndpoint: {
            fontSize: 12,
            bold: true,
            color: '#38a169',
            background: '#f0fff4',
            margin: [0, 8, 0, 4]
          }
        },
        defaultStyle: {
          fontSize: 11,
          color: '#4a5568',
          lineHeight: 1.4
        }
      };

      pdfMake.createPdf(docDefinition).download(fileName);
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error('No se pudo generar el PDF. Verifica que pdfMake esté correctamente instalado.');
    }
  }

  /**
   * Convierte texto markdown a contenido compatible con pdfMake
   * @param markdown - Texto markdown
   * @returns Array de contenido para pdfMake
   */
  private parseMarkdownToPdfContent(markdown: string): any[] {
    const lines = markdown.split('\n');
    const content: any[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';
    let inTable = false;
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Bloques de código
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // Terminar bloque de código
          const codeText = codeBlockContent.join('\n');
          content.push({
            table: {
              widths: ['*'],
              body: [[{
                text: [
                  { text: `${codeBlockLanguage ? `[${codeBlockLanguage.toUpperCase()}]` : '[CODE]'}\n`, 
                    fontSize: 8, color: '#718096', bold: true },
                  { text: codeText, style: 'codeblock' }
                ],
                margin: [0, 0, 0, 0],
                alignment: 'left',
                preserveLeadingSpaces: true
              }]]
            },
            layout: {
              fillColor: () => '#f8fafc',
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#cbd5e0',
              vLineColor: () => '#cbd5e0',
              paddingLeft: () => 12,
              paddingRight: () => 12,
              paddingTop: () => 8,
              paddingBottom: () => 8
            },
            margin: [0, 12, 0, 16]
          });
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Iniciar bloque de código
          codeBlockLanguage = line.substring(3).trim();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }
      
      // Detectar estructura de proyecto con indentación (líneas que empiezan con espacios/├/└/│)
      if (line.match(/^[\s├└│└─]+/) && (line.includes('/') || line.includes('.java') || line.includes('.properties'))) {
        // Es parte de una estructura de directorios, formatear como código
        content.push({
          text: line,
          style: 'codeblock',
          fontSize: 9,
          margin: [0, 1, 0, 1],
          preserveLeadingSpaces: true
        });
        continue;
      }

      // Tablas markdown (líneas que empiezan y contienen '|')
      if (line.trim().startsWith('|') && line.includes('|')) {
        inTable = true;
        let row = line.trim().split('|').slice(1, -1).map(cell => cell.trim());
        
        // Filtrar líneas separadoras (que contienen solo - y |)
        const isSeparatorLine = row.every(cell => /^[-\s]*$/.test(cell));
        if (isSeparatorLine) {
          continue; // Saltar líneas separadoras de tabla
        }
        
        // Solo agregar filas con al menos una celda no vacía
        if (row.length > 0 && row.some(cell => cell.length > 0)) {
          tableRows.push(row);
        }
        
        // Si la siguiente línea no es tabla, termina la tabla
        if (i + 1 >= lines.length || !lines[i + 1].trim().startsWith('|')) {
          // Renderizar tabla solo si hay al menos dos filas (header + data)
          if (tableRows.length >= 1 && tableRows[0].length > 0) {
            // Normalizar el número de columnas: usar el máximo número de columnas
            const maxColumns = Math.max(...tableRows.map(row => row.length));
            
            // Rellenar filas que tengan menos columnas
            const normalizedRows = tableRows.map(row => {
              while (row.length < maxColumns) {
                row.push(''); // Agregar celdas vacías
              }
              return row;
            });
            
            const headerRow = normalizedRows[0].map(cell => ({ 
              text: cell || '', 
              style: 'tableHeader',
              alignment: 'center'
            }));
            
            const dataRows = normalizedRows.slice(1).map(row => 
              row.map(cell => ({ 
                text: cell || '', 
                style: 'tableCell',
                alignment: 'left'
              }))
            );
            
            // Calcular anchos de columna de manera más inteligente
            const columnWidths = normalizedRows[0].map((_, index) => {
              const maxLength = Math.max(...normalizedRows.map(row => (row[index] || '').length));
              if (maxLength < 10) return 60;
              if (maxLength < 20) return 80;
              if (maxLength < 40) return 120;
              return '*';
            });
            
            const tableBody = dataRows.length > 0 ? [headerRow, ...dataRows] : [headerRow];
            
            content.push({
              table: {
                headerRows: 1,
                widths: columnWidths,
                body: tableBody
              },
              layout: {
                fillColor: (rowIndex: number) => {
                  if (rowIndex === 0) return '#edf2f7';
                  return rowIndex % 2 === 0 ? '#f7fafc' : null;
                },
                hLineWidth: (i: number, node: any) => i === 0 || i === 1 || i === node.table.body.length ? 2 : 1,
                vLineWidth: () => 1,
                hLineColor: (i: number, node: any) => i === 0 || i === 1 || i === node.table.body.length ? '#a0aec0' : '#e2e8f0',
                vLineColor: () => '#e2e8f0',
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 6,
                paddingBottom: () => 6
              },
              margin: [0, 12, 0, 16]
            });
          }
          tableRows = [];
          inTable = false;
        }
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        const headerText = line.substring(2).trim();
        // Si es el primer header, aplicar estilo de título
        const isMainTitle = content.length === 0 || content.every(item => 
          !item.text || !item.style || !['title', 'header'].includes(item.style)
        );
        
        content.push({
          text: headerText,
          style: isMainTitle ? 'title' : 'header',
          pageBreak: isMainTitle ? undefined : 'before'
        });
      } else if (line.startsWith('## ')) {
        content.push({
          text: line.substring(3).trim(),
          style: 'subheader'
        });
      } else if (line.startsWith('### ')) {
        content.push({
          text: line.substring(4).trim(),
          style: 'subsubheader'
        });
      }
      // Listas
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        const listText = line.replace(/^(-|\*)\s/, '');
        content.push({
          table: {
            widths: [20, '*'],
            body: [[
              { text: '•', style: 'listItem', color: '#3182ce', bold: true, alignment: 'center' },
              { text: listText, style: 'listItem' }
            ]]
          },
          layout: 'noBorders',
          margin: [16, 0, 0, 4]
        });
      } else if (line.match(/^\d+\. /)) {
        const match = line.match(/^(\d+)\. (.*)/);
        if (match) {
          const number = match[1];
          const listText = match[2];
          content.push({
            table: {
              widths: [20, '*'],
              body: [[
                { text: `${number}.`, style: 'listItem', color: '#3182ce', bold: true, alignment: 'right' },
                { text: listText, style: 'listItem' }
              ]]
            },
            layout: 'noBorders',
            margin: [16, 0, 0, 4]
          });
        }
      }
      // Código inline
      else if (line.includes('`') && !line.startsWith('```')) {
        content.push({
          text: this.parseInlineCode(line),
          style: 'paragraph',
          margin: [0, 2, 0, 2]
        });
      }
      // Párrafos normales
      else if (line.trim() !== '') {
        // Detectar endpoints de API
        const apiEndpointPattern = /^(GET|POST|PUT|DELETE|PATCH)\s+\/[^\s]+/;
        const httpMethodPattern = /^(GET|POST|PUT|DELETE|PATCH)\s/;
        
        if (apiEndpointPattern.test(line.trim())) {
          const parts = line.trim().split(' ');
          const method = parts[0];
          const endpoint = parts.slice(1).join(' ');
          
          const methodColors: {[key: string]: string} = {
            'GET': '#38a169',
            'POST': '#3182ce', 
            'PUT': '#d69e2e',
            'DELETE': '#e53e3e',
            'PATCH': '#805ad5'
          };
          
          content.push({
            table: {
              widths: [60, '*'],
              body: [[
                { 
                  text: method, 
                  fillColor: methodColors[method] || '#718096',
                  color: 'white',
                  bold: true,
                  fontSize: 10,
                  alignment: 'center',
                  margin: [4, 6, 4, 6]
                },
                { 
                  text: endpoint, 
                  style: 'codeblock',
                  fontSize: 11,
                  margin: [8, 6, 4, 6]
                }
              ]]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#e2e8f0',
              vLineColor: () => '#e2e8f0'
            },
            margin: [0, 8, 0, 8]
          });
        }
        // Detectar Content-Type
        else if (line.trim().startsWith('Content-Type:')) {
          content.push({
            text: line.trim(),
            style: 'emphasis',
            background: '#edf2f7',
            margin: [0, 4, 0, 4]
          });
        }
        // Párrafo normal
        else {
          content.push({
            text: line,
            style: 'paragraph'
          });
        }
      }
      // Espacio en blanco (reducido)
      else {
        content.push({
          text: ' ',
          fontSize: 4,
          margin: [0, 2, 0, 2]
        });
      }
    }

    return content;
  }

  /**
   * Parsea código inline en una línea
   * @param line - Línea con código inline
   * @returns Array de objetos de texto con estilos
   */
  private parseInlineCode(line: string): any {
    const parts = [];
    const segments = line.split('`');
    for (let i = 0; i < segments.length; i++) {
      if (i % 2 === 0) {
        // Texto normal
        if (segments[i]) {
          parts.push({ text: segments[i] });
        }
      } else {
        // Código inline
        parts.push({ text: segments[i], background: '#f4f4f4', fontSize: 10 });
      }
    }
    return parts.length === 1 ? parts[0] : parts;
  }
}
