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
      project: {
        name: this.extractProjectName(backendCode),
        framework: 'Spring Boot 3.2.5',
        javaVersion: 'Java 21'
      },
      entities: [] as any[],
      repositories: [] as any[],
      services: [] as any[],
      controllers: [] as any[],
      dtos: {
        requests: [] as any[],
        responses: [] as any[]
      },
      mappers: [] as any[],
      summary: {
        totalEntities: 0,
        totalControllers: 0,
        totalServices: 0,
        totalRepositories: 0,
        totalDtos: 0
      }
    };

    // Extraer todas las entidades
    structure.entities = this.extractAllEntities(backendCode);
    structure.repositories = this.extractAllRepositories(backendCode);
    structure.services = this.extractAllServices(backendCode);
    structure.controllers = this.extractAllControllers(backendCode);
    structure.dtos.requests = this.extractAllDtoRequests(backendCode);
    structure.dtos.responses = this.extractAllDtoResponses(backendCode);
    structure.mappers = this.extractAllMappers(backendCode);

    // Actualizar contadores
    structure.summary.totalEntities = structure.entities.length;
    structure.summary.totalControllers = structure.controllers.length;
    structure.summary.totalServices = structure.services.length;
    structure.summary.totalRepositories = structure.repositories.length;
    structure.summary.totalDtos = structure.dtos.requests.length + structure.dtos.responses.length;
    return structure;
  }

  /**
   * Extrae el nombre del proyecto del código
   */
  private extractProjectName(backendCode: string): string {
    const match = backendCode.match(/PROYECTO:\s*(\w+)/);
    return match ? match[1] : 'Backend Project';
  }

  /**
   * Extrae todas las entidades del código
   */
  private extractAllEntities(backendCode: string): any[] {
    const entities: any[] = [];
    const entityMatches = backendCode.match(/\/\/ (\w+)\.java - ENTIDAD JPA[\s\S]*?(?=\/\/ \w+\.java|===|$)/g);
    
    entityMatches?.forEach(match => {
      const nameMatch = match.match(/\/\/ (\w+)\.java/);
      if (nameMatch) {
        entities.push({
          name: nameMatch[1],
          attributes: this.extractEntityAttributes(match),
          relationships: this.extractEntityRelationships(match)
        });
      }
    });
    
    return entities;
  }

  /**
   * Extrae todos los repositorios del código
   */
  private extractAllRepositories(backendCode: string): any[] {
    const repositories: any[] = [];
    const repoMatches = backendCode.match(/\/\/ (\w+Repository)\.java[\s\S]*?(?=\/\/ \w+Repository|===|$)/g);
    
    repoMatches?.forEach(match => {
      const nameMatch = match.match(/\/\/ (\w+Repository)\.java/);
      if (nameMatch) {
        repositories.push({
          name: nameMatch[1],
          entityName: nameMatch[1].replace('Repository', '')
        });
      }
    });
    
    return repositories;
  }

  /**
   * Extrae todos los servicios del código
   */
  private extractAllServices(backendCode: string): any[] {
    const services: any[] = [];
    const serviceMatches = backendCode.match(/\/\/ (\w+Service)[^\\n]*SERVICIO[\s\S]*?(?=\/\/ \w+Service|===|$)/g);
    
    serviceMatches?.forEach(match => {
      const nameMatch = match.match(/\/\/ (\w+Service)/);
      if (nameMatch) {
        services.push({
          name: nameMatch[1],
          entityName: nameMatch[1].replace('Service', ''),
          methods: this.extractServiceMethods(match)
        });
      }
    });
    
    return services;
  }

  /**
   * Extrae todos los controladores del código
   */
  private extractAllControllers(backendCode: string): any[] {
    const controllers: any[] = [];
    const controllerMatches = backendCode.match(/\/\/ (\w+Controller)[^\\n]*CONTROLADOR[\s\S]*?(?=\/\/ \w+Controller|===|$)/g);
    
    controllerMatches?.forEach(match => {
      const nameMatch = match.match(/\/\/ (\w+Controller)/);
      if (nameMatch) {
        controllers.push({
          name: nameMatch[1],
          entityName: nameMatch[1].replace('Controller', ''),
          basePath: this.extractBasePath(match),
          endpoints: this.extractControllerEndpoints(match)
        });
      }
    });
    
    return controllers;
  }

  /**
   * Extrae todos los DTOs Request del código
   */
  private extractAllDtoRequests(backendCode: string): any[] {
    const dtos: any[] = [];
    const dtoMatches = backendCode.match(/\/\/ (\w+Request)\.java - DTO REQUEST[\s\S]*?(?=\/\/ \w+Request|===|$)/g);
    
    dtoMatches?.forEach(match => {
      const nameMatch = match.match(/\/\/ (\w+Request)\.java/);
      if (nameMatch) {
        dtos.push({
          name: nameMatch[1],
          entityName: nameMatch[1].replace('Request', ''),
          fields: this.extractDtoFields(match)
        });
      }
    });
    
    return dtos;
  }

  /**
   * Extrae todos los DTOs Response del código
   */
  private extractAllDtoResponses(backendCode: string): any[] {
    const dtos: any[] = [];
    const dtoMatches = backendCode.match(/\/\/ (\w+Response)\.java - DTO RESPONSE[\s\S]*?(?=\/\/ \w+Response|===|$)/g);
    
    dtoMatches?.forEach(match => {
      const nameMatch = match.match(/\/\/ (\w+Response)\.java/);
      if (nameMatch) {
        dtos.push({
          name: nameMatch[1],
          entityName: nameMatch[1].replace('Response', ''),
          fields: this.extractDtoFields(match)
        });
      }
    });
    
    return dtos;
  }

  /**
   * Extrae todos los Mappers del código
   */
  private extractAllMappers(backendCode: string): any[] {
    const mappers: any[] = [];
    const mapperMatches = backendCode.match(/\/\/ (\w+Mapper)\.java - MAPPER[\s\S]*?(?=\/\/ \w+Mapper|===|$)/g);
    
    mapperMatches?.forEach(match => {
      const nameMatch = match.match(/\/\/ (\w+Mapper)\.java/);
      if (nameMatch) {
        mappers.push({
          name: nameMatch[1],
          entityName: nameMatch[1].replace('Mapper', '')
        });
      }
    });
    
    return mappers;
  }

  /**
   * Extrae atributos de una entidad
   */
  private extractEntityAttributes(entityCode: string): string[] {
    const attributes: string[] = [];
    const attributeMatches = entityCode.match(/@Column[\s\S]*?private\s+(\w+)\s+(\w+);/g);
    
    attributeMatches?.forEach(match => {
      const fieldMatch = match.match(/private\s+(\w+)\s+(\w+);/);
      if (fieldMatch) {
        attributes.push(`${fieldMatch[2]} (${fieldMatch[1]})`);
      }
    });
    
    return attributes;
  }

  /**
   * Extrae relaciones de una entidad
   */
  private extractEntityRelationships(entityCode: string): string[] {
    const relationships: string[] = [];
    const relationMatches = entityCode.match(/@(OneToMany|ManyToOne|ManyToMany|OneToOne)[\s\S]*?private\s+[\w\.<>]+\s+(\w+);/g);
    
    relationMatches?.forEach(match => {
      const typeMatch = match.match(/@(OneToMany|ManyToOne|ManyToMany|OneToOne)/);
      const fieldMatch = match.match(/private\s+[\w\.<>]+\s+(\w+);/);
      if (typeMatch && fieldMatch) {
        relationships.push(`${typeMatch[1]} con ${fieldMatch[1]}`);
      }
    });
    
    return relationships;
  }

  /**
   * Extrae métodos de servicio
   */
  private extractServiceMethods(serviceCode: string): string[] {
    const methods: string[] = [];
    const methodMatches = serviceCode.match(/public\s+\w+\s+(\w+)\(/g);
    
    methodMatches?.forEach(match => {
      const methodMatch = match.match(/public\s+\w+\s+(\w+)\(/);
      if (methodMatch) {
        methods.push(methodMatch[1]);
      }
    });
    
    return methods;
  }

  /**
   * Extrae endpoints de controlador
   */
  private extractControllerEndpoints(controllerCode: string): string[] {
    const endpoints: string[] = [];
    const endpointMatches = controllerCode.match(/@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)[\s\S]*?public\s+[\w<>]+\s+(\w+)\(/g);
    
    endpointMatches?.forEach(match => {
      const httpMethod = match.match(/@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)/);
      const methodName = match.match(/public\s+[\w<>]+\s+(\w+)\(/);
      if (httpMethod && methodName) {
        endpoints.push(`${httpMethod[1].replace('Mapping', '').toUpperCase()} - ${methodName[1]}`);
      }
    });
    
    return endpoints;
  }

  /**
   * Extrae la ruta base del controlador
   */
  private extractBasePath(controllerCode: string): string {
    const match = controllerCode.match(/@RequestMapping\("([^"]+)"\)/);
    return match ? match[1] : '/api';
  }

  /**
   * Extrae campos de DTO
   */
  private extractDtoFields(dtoCode: string): string[] {
    const fields: string[] = [];
    const fieldMatches = dtoCode.match(/private\s+(\w+)\s+(\w+);/g);
    
    fieldMatches?.forEach(match => {
      const fieldMatch = match.match(/private\s+(\w+)\s+(\w+);/);
      if (fieldMatch) {
        fields.push(`${fieldMatch[2]} (${fieldMatch[1]})`);
      }
    });
    
    return fields;
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
    const entitiesInfo = structuredData.entities?.map((entity: any) => 
      `- ${entity.name}: ${entity.attributes?.length || 0} atributos, ${entity.relationships?.length || 0} relaciones`
    ).join('\n') || 'No hay entidades';
    
    const controllersInfo = structuredData.controllers?.map((controller: any) => 
      `- ${controller.name}: ${controller.endpoints?.length || 0} endpoints en ${controller.basePath}`
    ).join('\n') || 'No hay controladores';

    return `
Eres un experto en documentación técnica de software. Tu tarea es crear una documentación técnica completa y profesional para un proyecto Spring Boot usando EXACTAMENTE la estructura que te proporcionaré.

=== INFORMACIÓN DEL PROYECTO ===
Nombre: ${structuredData.project?.name || projectName}
Framework: ${structuredData.project?.framework || 'Spring Boot 3.2.5'}
Java: ${structuredData.project?.javaVersion || 'Java 21'}
Arquitectura: API REST con patrón de capas
Base de datos: H2 Database (embedded)
Documentación API: OpenAPI/Swagger

=== COMPONENTES DETECTADOS ===
Entidades JPA: ${structuredData.summary?.totalEntidades || 0} (${structuredData.entities?.map((e: any) => e.name).join(', ')})
Repositorios: ${structuredData.summary?.totalRepositories || 0}
Servicios: ${structuredData.summary?.totalServices || 0}
Controladores REST: ${structuredData.summary?.totalControllers || 0}
DTOs: ${structuredData.summary?.totalDtos || 0}
Mappers: ${structuredData.mappers?.length || 0}

=== DATOS ESTRUCTURADOS PARA PROCESAR ===
ENTIDADES: ${JSON.stringify(structuredData.entities, null, 2)}
CONTROLADORES: ${JSON.stringify(structuredData.controllers, null, 2)}
SERVICIOS: ${JSON.stringify(structuredData.services, null, 2)}
REPOSITORIOS: ${JSON.stringify(structuredData.repositories, null, 2)}
DTOS REQUEST: ${JSON.stringify(structuredData.dtos?.requests, null, 2)}
DTOS RESPONSE: ${JSON.stringify(structuredData.dtos?.responses, null, 2)}
MAPPERS: ${JSON.stringify(structuredData.mappers, null, 2)}

=== ESTRUCTURA EXACTA A SEGUIR ===
# Documentación del Backend: ${structuredData.project?.name || projectName}

## 1. Introducción

Backend REST API desarrollado con Spring Boot 3.2.5 y Java 21, generado automáticamente desde un diagrama UML. Implementa una arquitectura por capas con patrón MVC y operaciones CRUD completas.

**Tecnologías Utilizadas:**
- Spring Boot 3.2.5
- Spring Data JPA
- Spring Web MVC
- Base de datos H2 (desarrollo)
- OpenAPI/Swagger para documentación
- Maven como gestor de dependencias

**Arquitectura:**
- **Controladores REST:** Manejan las peticiones HTTP y respuestas
- **Servicios:** Contienen la lógica de negocio y transacciones
- **Repositorios:** Acceso a datos con Spring Data JPA
- **Entidades:** Modelos de datos con anotaciones JPA
- **DTOs:** Objetos de transferencia de datos para requests/responses
- **Mappers:** Conversión entre entidades y DTOs

## 2. Estructura del Proyecto

\`\`\`
${structuredData.project?.name || 'backend-spring-boot'}/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/
    │   │   └── [paquete.base]/
    │   │       ├── Application.java
    │   │       ├── controller/
    │   │       │   ├── [Entidad]Controller.java
    │   │       │   └── [...]Controller.java
    │   │       ├── service/
    │   │       │   ├── [Entidad]Service.java
    │   │       │   └── [...]Service.java
    │   │       ├── repository/
    │   │       │   ├── [Entidad]Repository.java
    │   │       │   └── [...]Repository.java
    │   │       ├── entity/
    │   │       │   ├── [Entidad].java
    │   │       │   └── [...].java
    │   │       ├── dto/
    │   │       │   ├── [Entidad]Request.java
    │   │       │   ├── [Entidad]Response.java
    │   │       │   └── [...]DTO.java
    │   │       └── mapper/
    │   │           ├── [Entidad]Mapper.java
    │   │           └── [...]Mapper.java
    │   └── resources/
    │       └── application.yml
    └── test/
\`\`\`

## 3. Entidades JPA

[PARA CADA ENTIDAD en structuredData.entities, crear una subsección 3.X]

### 3.X [NombreEntidad]

**Descripción:** [Propósito de la entidad basado en sus atributos y relaciones]

**Tabla de Base de Datos:** \`[nombre_tabla_snake_case]\`

**Atributos:**

| Campo | Tipo Java | Tipo BD | Descripción | Anotaciones JPA |
|-------|-----------|---------|-------------|-----------------|
| [Para cada atributo en entity.attributes, crear fila] |

**Relaciones:**
- [Para cada relación en entity.relationships, describir detalladamente]

## 4. Repositorios JPA

[PARA CADA REPOSITORIO en structuredData.repositories, crear una subsección 4.X]

### 4.X [NombreEntidad]Repository

**Extends:** JpaRepository<[Entidad], Long>

**Funcionalidad:** Acceso a datos para la entidad [NombreEntidad] con operaciones CRUD automáticas.

**Métodos Heredados:**
- \`List<[Entidad]> findAll()\` - Listar todos los registros
- \`Optional<[Entidad]> findById(Long id)\` - Buscar por ID
- \`<S extends [Entidad]> S save(S entity)\` - Guardar o actualizar
- \`void deleteById(Long id)\` - Eliminar por ID
- \`long count()\` - Contar registros
- \`boolean existsById(Long id)\` - Verificar existencia

## 5. Servicios (Lógica de Negocio)

[PARA CADA SERVICIO en structuredData.services, crear una subsección 5.X]

### 5.X [NombreEntidad]Service

**Anotaciones:** @Service, @Transactional

**Dependencias Inyectadas:**
- [NombreEntidad]Repository
- [NombreEntidad]Mapper

**Operaciones CRUD Implementadas:**

| Método | Parámetros | Retorno | Descripción | Transaccional |
|--------|------------|---------|-------------|---------------|
| [Para cada método en service.methods, crear fila] |

## 6. DTOs (Data Transfer Objects)

[PARA CADA ENTIDAD que tenga DTOs, crear una subsección 6.X]

### 6.X [NombreEntidad] DTOs

#### Request DTO
**Propósito:** Recibir datos del cliente para crear/actualizar entidades
**Campos:** [Listar campos de structuredData.dtos.requests para esta entidad]

#### Response DTO
**Propósito:** Enviar datos al cliente como respuesta
**Campos:** [Listar campos de structuredData.dtos.responses para esta entidad]

#### Mapper
**Propósito:** Convertir entre entidades y DTOs

## 7. Controladores REST

[PARA CADA CONTROLADOR en structuredData.controllers, crear una subsección 7.X]

### 7.X [NombreEntidad]Controller

**Base Path:** \`[BasePath del controlador]\`
**Anotaciones:** @RestController, @RequestMapping

**Endpoints Disponibles:**

| Método HTTP | Endpoint | Descripción | Request Body | Response Status | Response Body |
|-------------|----------|-------------|--------------|-----------------|---------------|
| [Para cada endpoint en controller.endpoints, crear fila] |

**Ejemplos de Uso:**

**POST** /api/[recurso]
\`\`\`json
{
  [Ejemplo basado en los campos del Request DTO real]
}
\`\`\`

**GET** /api/[recurso]/{id} - Response:
\`\`\`json
{
  [Ejemplo basado en los campos del Response DTO real]
}
\`\`\`

## 8. Configuración del Proyecto

### 8.1 Dependencias Maven (pom.xml)
[Mencionar las dependencias principales de Spring Boot]

### 8.2 Configuración de la Aplicación (application.yml)
[Configuración típica de H2 y JPA]

### 8.3 Clase Principal de Spring Boot
[Configuración básica de @SpringBootApplication]

## 9. Diagrama Entidad-Relación

\`\`\`
[Crear diagrama ERD textual basado en las relaciones encontradas en structuredData.entities]
\`\`\`

## 10. Guía de Ejecución

1. **Prerrequisitos:** Java 21, Maven 3.9+
2. **Compilar:** \`mvn clean compile\`
3. **Ejecutar:** \`mvn spring-boot:run\`
4. **Swagger UI:** http://localhost:8080/swagger-ui.html
5. **Base de datos H2:** http://localhost:8080/h2-console

## 11. Próximos Pasos

1. **Validación:** Agregar @Valid y anotaciones de validación en DTOs
2. **Manejo de Errores:** Implementar @ControllerAdvice para excepciones globales
3. **Seguridad:** Integrar Spring Security para autenticación/autorización
4. **Testing:** Crear tests unitarios para servicios y controladores
5. **Persistencia:** Migrar de H2 a PostgreSQL/MySQL para producción
6. **Monitoreo:** Configurar Spring Boot Actuator
7. **Cache:** Implementar cache con Spring Cache
8. **Logging:** Configurar Logback estructurado

=== INSTRUCCIONES CRÍTICAS ===
1. DEBES procesar TODAS las entidades en structuredData.entities (${structuredData.entities?.map((e: any) => e.name).join(', ')})
2. DEBES crear una subsección numerada para CADA entidad, controlador, servicio, repositorio
3. DEBES usar la estructura EXACTA que te proporcioné arriba
4. NO omitas ningún componente
5. Mantén el formato markdown profesional
6. Incluye tablas detalladas donde se especifica
7. Genera ejemplos JSON realistas basados en los DTOs reales
8. Describe las relaciones entre entidades de forma clara y técnica

Genera la documentación completa siguiendo EXACTAMENTE esta estructura:
`;
  }

  /**
   * Parsea la respuesta de documentación de la IA
   */
  private parseDocumentationResponse(response: any): string {
    try {
      let responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Remover marcas de código markdown si existen
      responseText = responseText.replace(/```markdown\n?/g, '').replace(/```\n?/g, '').trim();
      
      
      return responseText || 'No se pudo generar la documentación técnica.';
    } catch (error) {
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
      
      
      // Intentar parsear como JSON
      const parsedResponse = JSON.parse(responseText);
      
      return {
        suggestions: parsedResponse.suggestions || [],
        modifiedSnapshot: parsedResponse.modifiedSnapshot,
        summary: parsedResponse.summary || 'Análisis completado'
      };
    } catch (error) {
      return {
        suggestions: [],
        summary: 'Error al procesar las sugerencias de la IA'
      };
    }
  }
}
