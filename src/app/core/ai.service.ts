import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';

// Interfaces para las sugerencias
export interface UMLSuggestion {
  type: 'attribute' | 'relation' | 'improvement' | 'warning';
  target: string; // ID de la clase o relación objetivo
  title: string;
  description: string;
  implementation?: any; // Datos específicos para aplicar la sugerencia
}

export interface UMLSuggestionsResponse {
  suggestions: UMLSuggestion[];
  modifiedSnapshot?: any; // Snapshot opcional con las mejoras aplicadas
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {

  private geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(private http: HttpClient) { }

  /**
   * Envía el prompt a Gemini y retorna la respuesta
   */
  submitPrompt(prompt: string): Observable<any> {
    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };
    const headers = new HttpHeaders().set('x-goog-api-key', environment.geminiApiKey);
    return this.http.post<any>(this.geminiUrl, body, { headers });
  }

  /**
   * Método especializado para enviar datos estructurados de UML con mejor contexto
   */
  submitUMLAnalysis(
    snapshot: any, 
    userInstruction: string, 
    analysisType: 'suggestions' | 'voice_command' | 'validation',
    additionalContext?: string
  ): Observable<UMLSuggestionsResponse> {
    const contextRules = this.getUMLContextRules();
    const structuredPrompt = this.buildStructuredUMLPrompt(
      snapshot, 
      userInstruction, 
      analysisType, 
      contextRules,
      additionalContext
    );
    
    return this.submitPrompt(structuredPrompt).pipe(
      map(response => this.parseUMLSuggestionsResponse(response))
    );
  }

  /**
   * Genera sugerencias para el diagrama UML basado en el snapshot actual
   */
  generateUMLSuggestions(snapshot: any): Observable<UMLSuggestionsResponse> {
    const instruction = 'Analiza las clases existentes y sugiere atributos relevantes basados en buenas prácticas. Identifica relaciones faltantes o incorrectas entre las clases. Detecta inconsistencias, redundancias o errores en el modelo. Sugiere mejoras estructurales (normalización, entidades intermedias, etc.)';
    
    return this.submitUMLAnalysis(snapshot, instruction, 'suggestions');
  }

  /**
   * Procesa un comando de voz para modificar el diagrama UML
   */
  processVoiceCommand(snapshot: any, voiceCommand: string): Observable<UMLSuggestionsResponse> {
    return this.submitUMLAnalysis(snapshot, voiceCommand, 'voice_command');
  }

  /**
   * Valida la estructura del diagrama UML
   */
  validateUMLStructure(snapshot: any): Observable<UMLSuggestionsResponse> {
    const instruction = 'Valida la estructura del diagrama UML. Verifica que todas las clases tengan claves primarias, que las relaciones sean consistentes, que no haya redundancias y que el modelo siga buenas prácticas de diseño.';
    
    return this.submitUMLAnalysis(snapshot, instruction, 'validation');
  }

  /**
   * Genera documentación técnica para código Spring Boot generado
   */
  generateTechnicalDocumentation(backendCode: string, projectName: string): Observable<string> {
    const structuredData = this.parseBackendCodeStructure(backendCode);
    const prompt = this.buildDocumentationPrompt(structuredData, projectName);
    
    return this.submitPrompt(prompt).pipe(
      map(response => this.parseDocumentationResponse(response))
    );
  }

  /**
   * Construye un prompt estructurado y optimizado para análisis UML
   */
  private buildStructuredUMLPrompt(
    snapshot: any,
    userInstruction: string,
    analysisType: 'suggestions' | 'voice_command' | 'validation',
    contextRules: string,
    additionalContext?: string
  ): string {
    const basePrompt = `
Eres un experto en modelado UML y diseño de bases de datos. Tu objetivo es ${this.getAnalysisTypeDescription(analysisType)}.

=== CONTEXTO DEL PROYECTO ===
${contextRules}

${additionalContext ? `=== CONTEXTO ADICIONAL ===\n${additionalContext}\n` : ''}

=== ESTADO ACTUAL DEL DIAGRAMA ===
${this.formatSnapshotForAI(snapshot)}

=== INSTRUCCIÓN DEL USUARIO ===
${userInstruction}

=== FORMATO DE RESPUESTA REQUERIDO ===
Responde ÚNICAMENTE con un objeto JSON válido sin bloques de código markdown ni texto adicional.

${this.getResponseFormatByType(analysisType)}

REGLAS IMPORTANTES:
- NO uses bloques de código markdown (\`\`\`json)
- Responde solo JSON puro
- Siempre incluye un resumen claro de lo que analizaste/hiciste
- Para clases nuevas, usa IDs temporales únicos como "temp_class_[nombre]"
- Asegúrate de que cada clase nueva tenga al menos un atributo marcado como isPrimaryKey: true`;

    return basePrompt;
  }

  /**
   * Obtiene la descripción del tipo de análisis
   */
  private getAnalysisTypeDescription(type: 'suggestions' | 'voice_command' | 'validation'): string {
    switch (type) {
      case 'suggestions':
        return 'analizar el diagrama UML y proporcionar sugerencias específicas y justificadas para mejorarlo';
      case 'voice_command':
        return 'interpretar exactamente lo que el usuario quiere hacer y generar los cambios necesarios en el diagrama';
      case 'validation':
        return 'validar la estructura del diagrama UML y detectar posibles errores o inconsistencias';
      default:
        return 'analizar el diagrama UML';
    }
  }

  /**
   * Formatea el snapshot para que sea más legible para la IA
   */
  private formatSnapshotForAI(snapshot: any): string {
    if (!snapshot) return 'No hay diagrama actual.';
    
    const formatted = {
      metadata: {
        totalClasses: snapshot.classes?.length || 0,
        totalRelations: snapshot.relations?.length || 0
      },
      classes: snapshot.classes?.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        visibility: cls.visibility,
        attributeCount: cls.attributes?.length || 0,
        attributes: cls.attributes || []
      })) || [],
      relations: snapshot.relations?.map((rel: any) => ({
        id: rel.id,
        type: rel.type,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        sourceMultiplicity: rel.sourceMultiplicity,
        targetMultiplicity: rel.targetMultiplicity,
        name: rel.name
      })) || []
    };
    
    return JSON.stringify(formatted, null, 2);
  }

  /**
   * Obtiene el formato de respuesta según el tipo de análisis
   */
  private getResponseFormatByType(type: 'suggestions' | 'voice_command' | 'validation'): string {
    const baseFormat = `{
  "suggestions": [
    {
      "type": "attribute|relation|class|improvement|warning",
      "target": "ID_de_clase_o_relacion",
      "title": "Título breve de la acción",
      "description": "Descripción detallada de lo que se está haciendo",
      "implementation": {
        "attributeToAdd": [
          { "name": "email", "typeName": "string", "isRequired": true, "isPrimaryKey": false }
        ],
        "attributeToModify": { "name": "ci", "propertyName": "isPrimaryKey", "newValue": false },
        "classToModify": { "propertyName": "name", "newValue": "NuevoNombre" },
        "classToAdd": {
          "id": "temp_id_unique", 
          "name": "NombreClase", 
          "visibility": "PUBLIC",
          "attributes": [
            { "name": "id", "typeName": "int", "isRequired": true, "isPrimaryKey": true }
          ]
        },
        "relationToAdd": { 
          "sourceId": "clase1", 
          "targetId": "clase2", 
          "type": "Asociación", 
          "sourceMultiplicity": "1", 
          "targetMultiplicity": "*",
          "name": ""
        }
      }
    }
  ],
  "summary": "Resumen de las acciones realizadas"
}`;

    switch (type) {
      case 'voice_command':
        return baseFormat + `

EJEMPLOS DE COMANDOS:
- "Crea una clase Usuario con nombre, email y edad" → Crear nueva clase con esos atributos
- "Agrega teléfono a Usuario" → Agregar atributo a clase existente
- "Relaciona Usuario con Pedido uno a muchos" → Crear relación entre clases
- "Cambia el nombre de Usuario a Cliente" → Modificar nombre de clase`;
      
      case 'suggestions':
        return baseFormat + `

TIPOS DE SUGERENCIAS:
- "attribute": Para agregar o modificar atributos
- "relation": Para crear o modificar relaciones
- "class": Para crear o modificar clases
- "improvement": Para mejoras estructurales
- "warning": Para alertar sobre problemas`;
      
      default:
        return baseFormat;
    }
  }



  /**
   * Define las reglas de contexto del proyecto UML
   */
  private getUMLContextRules(): string {
    return `
REGLAS DEL PROYECTO:
- Tipos de atributos permitidos: string, int, long, boolean, float, double, date, datetime, BigDecimal
- Tipos de relaciones: Herencia, Asociación, Agregación, Composición, Dependencia, AsociaciónNtoN
- Para AsociaciónNtoN se crea automáticamente una clase intermedia con dos atributos PK
- Cada clase debe tener al menos un atributo marcado como clave primaria (isPrimaryKey: true)
- Las multiplicidades válidas son: '1', '0..1', '*', '1..*'
- Visibilidad de clases: PUBLIC, PRIVATE, PROTECTED
- Los atributos tienen: name, typeName, isRequired, isPrimaryKey, position
- Las relaciones pueden tener: sourceMultiplicity, targetMultiplicity, name, associationClassId
`;
  }

  /**
   * Parsea el código del backend y lo estructura para mejor comprensión de la IA
   */
  private parseBackendCodeStructure(backendCode: string): any {
    // Extraer información estructurada del código
    const structure = {
      projectSummary: {
        totalFiles: 0,
        entities: [] as string[],
        repositories: [] as string[],
        services: [] as string[],
        controllers: [] as string[],
        dtos: [] as string[]
      },
      architecture: {
        pattern: 'Spring Boot REST API',
        layers: ['Entity', 'Repository', 'Service', 'Controller', 'DTO'],
        database: 'H2 Database (embedded)',
        documentation: 'OpenAPI/Swagger'
      },
      codeDetails: [] as any[]
    };

    // Dividir el código en secciones más manejables
    const sections = backendCode.split(/=== .+ ===/);
    
    sections.forEach(section => {
      if (section.trim()) {
        const lines = section.split('\n');
        const firstMeaningfulLine = lines.find(line => line.trim() && !line.startsWith('//'));
        
        if (firstMeaningfulLine) {
          // Identificar tipo de archivo
          let fileType = 'unknown';
          let fileName = 'unknown';
          
          if (section.includes('@Entity')) {
            fileType = 'entity';
            const match = firstMeaningfulLine.match(/class (\w+)/);
            fileName = match ? match[1] : 'Entity';
            structure.projectSummary.entities.push(fileName);
          } else if (section.includes('@Repository')) {
            fileType = 'repository';
            const match = firstMeaningfulLine.match(/interface (\w+)/);
            fileName = match ? match[1] : 'Repository';
            structure.projectSummary.repositories.push(fileName);
          } else if (section.includes('@Service')) {
            fileType = 'service';
            const match = firstMeaningfulLine.match(/class (\w+)/);
            fileName = match ? match[1] : 'Service';
            structure.projectSummary.services.push(fileName);
          } else if (section.includes('@RestController')) {
            fileType = 'controller';
            const match = firstMeaningfulLine.match(/class (\w+)/);
            fileName = match ? match[1] : 'Controller';
            structure.projectSummary.controllers.push(fileName);
          } else if (section.includes('Request') || section.includes('Response')) {
            fileType = 'dto';
            const match = firstMeaningfulLine.match(/class (\w+)/);
            fileName = match ? match[1] : 'DTO';
            structure.projectSummary.dtos.push(fileName);
          }

          structure.codeDetails.push({
            type: fileType,
            name: fileName,
            preview: this.extractCodePreview(section),
            keyFeatures: this.extractKeyFeatures(section, fileType)
          });
        }
      }
    });

    structure.projectSummary.totalFiles = structure.codeDetails.length;
    return structure;
  }

  /**
   * Extrae una vista previa limpia del código
   */
  private extractCodePreview(section: string): string {
    const lines = section.split('\n');
    const relevantLines = lines
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.startsWith('import') && 
               !trimmed.startsWith('package') &&
               !trimmed.startsWith('//') &&
               trimmed !== '{' && 
               trimmed !== '}';
      })
      .slice(0, 8); // Solo las primeras 8 líneas relevantes

    return relevantLines.join('\n');
  }

  /**
   * Extrae características clave según el tipo de archivo
   */
  private extractKeyFeatures(section: string, fileType: string): string[] {
    const features: string[] = [];
    
    switch (fileType) {
      case 'entity':
        if (section.includes('@Id')) features.push('Tiene clave primaria');
        if (section.includes('@OneToMany')) features.push('Relación One-to-Many');
        if (section.includes('@ManyToOne')) features.push('Relación Many-to-One');
        if (section.includes('@ManyToMany')) features.push('Relación Many-to-Many');
        const fieldCount = (section.match(/@Column/g) || []).length;
        if (fieldCount > 0) features.push(`${fieldCount} campos`);
        break;
        
      case 'controller':
        if (section.includes('@GetMapping')) features.push('Operaciones GET');
        if (section.includes('@PostMapping')) features.push('Operaciones POST');
        if (section.includes('@PutMapping')) features.push('Operaciones PUT');
        if (section.includes('@DeleteMapping')) features.push('Operaciones DELETE');
        break;
        
      case 'service':
        if (section.includes('findAll')) features.push('Listado');
        if (section.includes('findById')) features.push('Búsqueda por ID');
        if (section.includes('save')) features.push('Guardado');
        if (section.includes('delete')) features.push('Eliminación');
        break;
    }
    
    return features;
  }

  /**
   * Construye un prompt optimizado para generar documentación técnica
   */
  private buildDocumentationPrompt(structuredData: any, projectName: string): string {
    return `
Eres un experto en documentación técnica de software. Tu tarea es generar una documentación técnica completa y profesional para un proyecto Spring Boot generado automáticamente desde un diagrama UML.

=== INFORMACIÓN DEL PROYECTO ===
Nombre: ${projectName}
Tipo: Backend Spring Boot REST API
Generado: Automáticamente desde diagrama UML

=== RESUMEN DE LA ARQUITECTURA ===
Patrón: ${structuredData.architecture.pattern}
Capas: ${structuredData.architecture.layers.join(', ')}
Base de datos: ${structuredData.architecture.database}
Documentación API: ${structuredData.architecture.documentation}

=== ESTADÍSTICAS DEL CÓDIGO ===
Total de archivos: ${structuredData.projectSummary.totalFiles}
Entidades: ${structuredData.projectSummary.entities.length} (${structuredData.projectSummary.entities.join(', ')})
Repositorios: ${structuredData.projectSummary.repositories.length} (${structuredData.projectSummary.repositories.join(', ')})
Servicios: ${structuredData.projectSummary.services.length} (${structuredData.projectSummary.services.join(', ')})
Controladores: ${structuredData.projectSummary.controllers.length} (${structuredData.projectSummary.controllers.join(', ')})
DTOs: ${structuredData.projectSummary.dtos.length} (${structuredData.projectSummary.dtos.join(', ')})

=== DETALLES DE COMPONENTES ===
${structuredData.codeDetails.map((detail: any) => `
**${detail.name}** (${detail.type.toUpperCase()})
Características: ${detail.keyFeatures.join(', ')}
Vista previa del código:
${detail.preview}
`).join('\n')}

=== INSTRUCCIONES PARA LA DOCUMENTACIÓN ===
Genera una documentación técnica completa que incluya:

1. **Resumen Ejecutivo**: Descripción general del proyecto y su propósito
2. **Arquitectura del Sistema**: Explicación de la arquitectura por capas implementada
3. **Modelo de Datos**: Descripción de las entidades y sus relaciones
4. **API REST**: Documentación de los endpoints disponibles
5. **Configuración**: Detalles de configuración de base de datos y aplicación
6. **Instalación y Ejecución**: Pasos para instalar y ejecutar el proyecto
7. **Estructura de Archivos**: Organización del código fuente
8. **Consideraciones Técnicas**: Patrones utilizados y mejores prácticas aplicadas

FORMATO DE RESPUESTA:
- Utiliza markdown para el formato
- Sé específico y técnico pero comprensible
- Incluye ejemplos cuando sea apropiado
- Organiza la información de manera lógica y profesional
- La documentación debe ser útil tanto para desarrolladores como para stakeholders técnicos

IMPORTANTE: Responde SOLO con el contenido de la documentación en markdown, sin bloques de código adicionales ni explicaciones fuera del documento.`;
  }

  /**
   * Parsea la respuesta de documentación de la IA
   */
  private parseDocumentationResponse(response: any): string {
    try {
      let responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Remover marcas de código markdown si existen
      responseText = responseText.replace(/```markdown\n?/g, '').replace(/```\n?/g, '').trim();
      
      console.log('📖 Documentación generada por IA');
      
      return responseText || 'No se pudo generar la documentación técnica.';
    } catch (error) {
      console.error('Error parseando documentación de IA:', error);
      return 'Error al procesar la documentación generada por la IA.';
    }
  }

  /**
   * Parsea la respuesta de la IA y la convierte al formato esperado
   */
  private parseUMLSuggestionsResponse(response: any): UMLSuggestionsResponse {
    try {
      // Extraer el texto de la respuesta de Gemini
      let responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Remover marcas de código markdown si existen
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      console.log('🤖 Texto limpio de la IA:', responseText);
      
      // Intentar parsear como JSON
      const parsedResponse = JSON.parse(responseText);
      
      return {
        suggestions: parsedResponse.suggestions || [],
        modifiedSnapshot: parsedResponse.modifiedSnapshot,
        summary: parsedResponse.summary || 'Análisis completado'
      };
    } catch (error) {
      console.error('Error parseando respuesta de IA:', error);
      console.error('Texto original:', response?.candidates?.[0]?.content?.parts?.[0]?.text);
      return {
        suggestions: [],
        summary: 'Error al procesar las sugerencias de la IA'
      };
    }
  }
}
