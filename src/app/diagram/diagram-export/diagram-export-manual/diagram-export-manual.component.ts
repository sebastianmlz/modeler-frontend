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
  prompt = `Tu tarea es generar una documentación técnica profesional para el proyecto "${this.projectName}". 

IMPORTANTE: NO copies literalmente el código que te proporciono. Analízalo y crea documentación profesional SOBRE ese código.

OBLIGATORIO: Usa ÚNICAMENTE las entidades que encuentres en el código proporcionado. Si encuentras entidades como "persona", "equipo", "estadio" úsalas tal como están. NO inventes entidades como "Alumno", "Curso", "Usuario" si no están en el código.

Genera ÚNICAMENTE la documentación siguiendo esta estructura exacta:

# ${this.projectName || 'Backend Spring Boot'} - Documentación Técnica

## 1. Introducción

Backend REST API desarrollado con Spring Boot 3.2.5 y Java 21, generado automáticamente desde un diagrama UML. Implementa una arquitectura por capas con patrón MVC y operaciones CRUD completas.

**Tecnologías Utilizadas:**
- Spring Boot 3.2.5
- Spring Data JPA
- Spring Web MVC  
- Base de datos H2 (desarrollo)
- Maven como gestor de dependencias
- Lombok para reducir código boilerplate

**Arquitectura:**
- **Controladores REST:** Manejan las peticiones HTTP y respuestas
- **Servicios:** Contienen la lógica de negocio y transacciones
- **Repositorios:** Acceso a datos con Spring Data JPA
- **Entidades:** Modelos de datos con anotaciones JPA
- **DTOs:** Objetos de transferencia de datos para requests/responses
- **Mappers:** Conversión entre entidades y DTOs

## 2. Estructura del Proyecto

\`\`\`
${this.projectName || 'backend-spring-boot'}/
├── pom.xml
├── README.md
└── src/
    └── main/
        ├── java/
        │   └── com/example/demo/
        │       ├── Application.java
        │       ├── controller/
        │       ├── service/
        │       ├── repository/
        │       ├── entity/
        │       ├── dto/
        │       └── mapper/
        └── resources/
            └── application.yml
\`\`\`

## 3. Entidades JPA

### 3.1 [Nombre de la primera entidad encontrada]

**Descripción:** [Describe brevemente el propósito de esta entidad]

**Tabla de Base de Datos:** \`[nombre_tabla_extraido_del_@Table]\`

**Atributos:**

| Campo | Tipo Java | Tipo BD | Descripción | Anotaciones JPA |
|-------|-----------|---------|-------------|-----------------|
| id | Long | BIGINT | Clave primaria auto-generada | @Id @GeneratedValue |
| [campo1] | [tipo] | [tipo_bd] | [propósito del campo] | [anotaciones principales] |
| [campo2] | [tipo] | [tipo_bd] | [propósito del campo] | [anotaciones principales] |

**Relaciones:**
- [Describir relaciones encontradas, ej: "Relación @OneToMany con Producto"]

### 3.2 [Nombre de la segunda entidad]
[Repetir estructura para cada entidad encontrada]

## 4. Repositorios JPA

### 4.1 [Nombre]Repository

**Funcionalidad:** Interfaz de acceso a datos que extiende JpaRepository para operaciones CRUD automáticas.

**Métodos Disponibles:**
- Operaciones CRUD estándar de JpaRepository
- Métodos de consulta personalizados (si los hay)

### 4.2 [Repetir para cada repositorio]

## 5. Servicios (Lógica de Negocio)

### 5.1 [Nombre]Service

**Responsabilidad:** Contiene la lógica de negocio para la entidad [Nombre].

**Operaciones CRUD:**

| Método | Descripción | Parámetros | Retorno |
|--------|-------------|------------|---------|
| create | Crear nueva entidad | [Entidad]Request | void |
| getById | Obtener por ID | Long id | [Entidad]Response |
| listAll | Listar todas | Ninguno | List<[Entidad]Response> |
| update | Actualizar existente | Long id, [Entidad]Request | void |
| delete | Eliminar por ID | Long id | void |

### 5.2 [Repetir para cada servicio]

## 6. DTOs (Data Transfer Objects)

### 6.1 [Entidad] - Request/Response DTOs

**[Entidad]Request:**
- Campos: [listar campos encontrados]
- Propósito: Recibir datos para crear/actualizar

**[Entidad]Response:**  
- Campos: [listar campos encontrados]
- Propósito: Enviar datos al cliente

### 6.2 [Repetir para cada conjunto de DTOs]

## 7. Controladores REST

### 7.1 [Entidad]Controller

**Base Path:** \`/api/[recurso]\`

**Endpoints:**

| Método | Endpoint | Descripción | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | /api/[recurso] | Listar todos | - | List<[Entidad]Response> |
| GET | /api/[recurso]/{id} | Obtener por ID | - | [Entidad]Response |
| POST | /api/[recurso] | Crear nuevo | [Entidad]Request | Status 201 |
| PUT | /api/[recurso]/{id} | Actualizar | [Entidad]Request | Status 200 |
| DELETE | /api/[recurso]/{id} | Eliminar | - | Status 204 |

**Ejemplo Request POST:**
\`\`\`json
{
  [campos del Request DTO reales]
}
\`\`\`

### 7.2 [Repetir para cada controlador]

## 8. Configuración

### 8.1 Configuración de Base de Datos (application.yml)
- Base de datos H2 en memoria para desarrollo
- Puerto: 8080
- Console H2 habilitada en /h2-console

### 8.2 Dependencias Maven
- Spring Boot Starter Web
- Spring Boot Starter Data JPA  
- H2 Database
- Lombok

## 9. Diagrama Entidad-Relación

\`\`\`
[Crear representación textual de las relaciones encontradas]
[Entidad1] ||--o{ [Entidad2] : "relación encontrada"
\`\`\`

## 10. API Endpoints Summary

**Base URL:** http://localhost:8080

**Recursos disponibles:**
[Listar todos los endpoints principales encontrados]

## 11. Guía de Ejecución

1. **Prerrequisitos:** Java 21, Maven 3.9+
2. **Compilar:** \`mvn clean compile\`  
3. **Ejecutar:** \`mvn spring-boot:run\`
4. **Acceder:** http://localhost:8080
5. **H2 Console:** http://localhost:8080/h2-console

---

**REGLAS CRÍTICAS:**
🎯 Analiza el código proporcionado y extrae información real
📋 Mantén la numeración y estructura exacta mostrada arriba  
✅ Completa cada sección con datos del código real
� NO copies bloques de código completos
🚫 NO inventes información que no esté en el código

A continuación te proporciono el código fuente para que lo analices:

${this.backendCode}`;

  constructor(
    private aiService: AiService,
    private pdfService: PdfService
  ) {}
  

  generateManual(): void {
    if (!this.backendCode.trim()) {
      this.error = 'No hay código backend para generar el manual.';
      return;
    }
    
    // Debug: verificar qué código estamos enviando
    console.log('=== CÓDIGO BACKEND QUE SE ENVÍA ===');
    console.log('Longitud:', this.backendCode.length);
    console.log('Primeros 500 caracteres:', this.backendCode.substring(0, 500));
    console.log('Contiene "persona"?', this.backendCode.includes('persona'));
    console.log('Contiene "equipo"?', this.backendCode.includes('equipo'));
    console.log('Contiene "estadio"?', this.backendCode.includes('estadio'));
    console.log('=== FIN DEBUG ===');
    
    this.loading = true;
    this.error = '';
    this.manualText = '';
    const prompt = this.prompt;
    console.log('=== PROMPT FINAL ===');
    console.log('Longitud del prompt:', prompt.length);
    console.log('=== FIN PROMPT ===');
    
    this.aiService.submitPrompt(prompt).subscribe({
      next: (res) => {
        console.log('Respuesta completa de Gemini:', res); // Para debug
        
        // La respuesta de Gemini tiene la estructura: candidates[0].content.parts[0].text
        if (res && res.candidates && res.candidates.length > 0 && 
            res.candidates[0].content && res.candidates[0].content.parts && 
            res.candidates[0].content.parts.length > 0) {
          this.manualText = res.candidates[0].content.parts[0].text || '';
        } else {
          this.error = 'No se pudo obtener respuesta válida de la IA';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al generar manual:', err);
        this.error = 'Error al generar el manual: ' + (err?.error?.error?.message || err?.message || err);
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
