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
  prompt = `Eres un experto arquitecto de software especializado en Spring Boot. El código proporcionado contiene un backend Spring Boot COMPLETO generado automáticamente desde un diagrama UML.

ESTE BACKEND INCLUYE TODO EL CÓDIGO GENERADO:

📁 **CONFIGURACIÓN:**
- pom.xml completo con dependencias Spring Boot
- application.yml con configuración H2 y JPA
- README.md con instrucciones
- Clase principal Application.java

📁 **ENTIDADES JPA (=== ENTIDADES JPA ===):**
- Clases con @Entity, @Table, @Id, @GeneratedValue
- Relaciones @OneToMany, @ManyToOne, @JoinColumn
- Getters, setters y constructores

📁 **REPOSITORIOS (=== REPOSITORIOS JPA ===):**
- Interfaces que extienden JpaRepository<Entity, Long>
- Anotación @Repository
- Métodos CRUD automáticos

📁 **SERVICIOS CRUD (=== SERVICIOS CRUD COMPLETOS ===):**
- Clases con @Service y @Transactional
- Inyección de repositorios y mappers
- Métodos: create(), getById(), listAll(), update(), delete()
- Conversión con mappers

📁 **CONTROLADORES REST (=== CONTROLADORES REST CRUD COMPLETOS ===):**
- Clases con @RestController y @RequestMapping
- Endpoints: GET, POST, PUT, DELETE
- ResponseEntity con códigos HTTP correctos
- Inyección de servicios

📁 **DTOs REQUEST (=== DTOs REQUEST ===):**
- Clases para recibir datos del cliente
- Validaciones con Jakarta Validation
- Constructores y getters/setters

📁 **DTOs RESPONSE (=== DTOs RESPONSE ===):**
- Clases para enviar datos al cliente
- Campos de respuesta específicos
- Constructores y getters/setters

📁 **MAPPERS (=== MAPPERS ===):**
- Clases con @Component
- Métodos toEntity() y toResponse()
- Conversión bidireccional Entity ↔ DTO

GENERA una documentación técnica profesional para "${this.projectName}" siguiendo EXACTAMENTE esta estructura:

# ${this.projectName || 'Backend Spring Boot'} - Documentación Técnica

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
${this.projectName || 'backend-spring-boot'}/
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

PARA CADA ENTIDAD en el código, crea una sección como esta:

### 3.X [NombreEntidad]

**Descripción:** [Propósito de la entidad]

**Tabla de Base de Datos:** \`[nombre_tabla]\`

**Atributos:**

| Campo | Tipo Java | Tipo BD | Descripción | Anotaciones JPA |
|-------|-----------|---------|-------------|-----------------|
| id | Long | BIGINT | Clave primaria | @Id @GeneratedValue |
| [campo] | [tipo] | [tipo_bd] | [descripción] | [anotaciones] |
| [campo] | [tipo] | [tipo_bd] | [descripción] | [anotaciones] |

**Relaciones:**
- [Describir cada relación @OneToMany, @ManyToOne, @ManyToMany encontrada]

**Código de la Entidad:**
\`\`\`java
[CÓDIGO COMPLETO Y EXACTO de la entidad del backend proporcionado]
\`\`\`

## 4. Repositorios JPA

PARA CADA REPOSITORIO en el código:

### 4.X [NombreEntidad]Repository
+
**Extends:** JpaRepository<[Entidad], Long>

**Funcionalidad:** Acceso a datos para la entidad [NombreEntidad] con operaciones CRUD automáticas.

**Métodos Heredados:**
- \`List<[Entidad]> findAll()\` - Listar todos los registros
- \`Optional<[Entidad]> findById(Long id)\` - Buscar por ID
- \`<S extends [Entidad]> S save(S entity)\` - Guardar o actualizar
- \`void deleteById(Long id)\` - Eliminar por ID
- \`long count()\` - Contar registros
- \`boolean existsById(Long id)\` - Verificar existencia

**Código del Repositorio:**
\`\`\`java
[CÓDIGO COMPLETO Y EXACTO del repositorio del backend proporcionado]
\`\`\`

## 5. Servicios (Lógica de Negocio)

PARA CADA SERVICIO CRUD en el código:

### 5.X [NombreEntidad]Service

**Anotaciones:** @Service, @Transactional

**Dependencias Inyectadas:**
- [NombreEntidad]Repository
- [NombreEntidad]Mapper

**Operaciones CRUD Implementadas:**

| Método | Parámetros | Retorno | Descripción | Transaccional |
|--------|------------|---------|-------------|---------------|
| create | [Entidad]Request | void | Crear nueva entidad | Sí |
| getById | Long id | [Entidad]Response | Obtener por ID | No |
| listAll | - | List<[Entidad]Response> | Listar todas | No |
| update | Long id, [Entidad]Request | void | Actualizar entidad | Sí |
| delete | Long id | void | Eliminar entidad | Sí |

**Código del Servicio:**
\`\`\`java
[CÓDIGO COMPLETO Y EXACTO del servicio CRUD del backend proporcionado]
\`\`\`

## 6. DTOs (Data Transfer Objects)

PARA CADA DTO en el código:

### 6.X [NombreEntidad] DTOs

#### Request DTO
**Propósito:** Recibir datos del cliente para crear/actualizar entidades

\`\`\`java
[CÓDIGO COMPLETO Y EXACTO del DTO Request del backend proporcionado]
\`\`\`

#### Response DTO
**Propósito:** Enviar datos al cliente como respuesta

\`\`\`java
[CÓDIGO COMPLETO Y EXACTO del DTO Response del backend proporcionado]
\`\`\`

#### Mapper
**Propósito:** Convertir entre entidades y DTOs

\`\`\`java
[CÓDIGO COMPLETO Y EXACTO del Mapper del backend proporcionado]
\`\`\`

## 7. Controladores REST

PARA CADA CONTROLADOR en el código:

### 7.X [NombreEntidad]Controller

**Base Path:** \`/api/[recurso]\`
**Anotaciones:** @RestController, @RequestMapping

**Endpoints Disponibles:**

| Método HTTP | Endpoint | Descripción | Request Body | Response Status | Response Body |
|-------------|----------|-------------|--------------|-----------------|---------------|
| GET | /api/[recurso] | Listar todos | Ninguno | 200 OK | List<[Entidad]Response> |
| GET | /api/[recurso]/{id} | Obtener por ID | Ninguno | 200 OK | [Entidad]Response |
| POST | /api/[recurso] | Crear nuevo | [Entidad]Request | 201 Created | Ninguno |
| PUT | /api/[recurso]/{id} | Actualizar | [Entidad]Request | 200 OK | Ninguno |
| DELETE | /api/[recurso]/{id} | Eliminar | Ninguno | 204 No Content | Ninguno |

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

**Código del Controlador:**
\`\`\`java
[CÓDIGO COMPLETO Y EXACTO del controlador CRUD del backend proporcionado]
\`\`\`

## 8. Configuración del Proyecto

### 8.1 Dependencias Maven (pom.xml)
\`\`\`xml
[Fragmento relevante del pom.xml si está en el código]
\`\`\`

### 8.2 Configuración de la Aplicación (application.yml)
\`\`\`yaml
[Contenido del application.yml del backend proporcionado]
\`\`\`

### 8.3 Clase Principal de Spring Boot
\`\`\`java
[CÓDIGO COMPLETO de la clase Application del backend proporcionado]
\`\`\`

## 9. Diagrama Entidad-Relación

\`\`\`
[Crear diagrama ERD textual basado en las relaciones @OneToMany/@ManyToOne encontradas en las entidades]

Ejemplo:
[Entidad1] ||--o{ [Entidad2] : "tiene muchas"
[Entidad2] }o--|| [Entidad3] : "pertenece a"
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

---

**INSTRUCCIONES CRÍTICAS - LEER ANTES DE DOCUMENTAR:**

🔍 **BÚSQUEDA POR SECCIONES:**
- Busca "=== ENTIDADES JPA ===" para encontrar todas las entidades
- Busca "=== REPOSITORIOS JPA ===" para encontrar todos los repositorios  
- Busca "=== SERVICIOS CRUD COMPLETOS ===" para encontrar servicios con métodos CRUD
- Busca "=== CONTROLADORES REST CRUD COMPLETOS ===" para controladores con endpoints
- Busca "=== DTOs REQUEST ===" para DTOs de entrada
- Busca "=== DTOs RESPONSE ===" para DTOs de salida
- Busca "=== MAPPERS ===" para clases de conversión

✅ **REGLAS OBLIGATORIAS:**
1. USA EXACTAMENTE el código que encuentres en cada sección - NO INVENTES NADA
2. Si una sección tiene código, documéntala completamente
3. Si no encuentras una sección, NO la menciones
4. TODAS las tablas deben tener el mismo número de columnas en cada fila
5. Si una celda está vacía, escribe "N/A" o "Ninguno" 
6. Copia el código tal como aparece, sin modificaciones
7. NO digas "No existe en el código" si puedes encontrarlo en las secciones

🚫 **ERRORES A EVITAR:**
- NO digas "No existe" si hay una sección con ese código
- NO inventes código que no esté en las secciones
- NO omitas componentes que encuentres en las secciones marcadas
- NO dejes celdas vacías en las tablas

CÓDIGO COMPLETO DEL BACKEND:
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
    this.loading = true;
    this.error = '';
    this.manualText = '';
    const prompt = this.prompt;
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
