// Convierte un string a CamelCase (para nombres de clases y archivos Java)
function toCamelCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ') // reemplaza guiones, guiones bajos, etc. por espacio
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}
// @ts-ignore
import JSZip from 'jszip';
// Utilidad para convertir package base a ruta de carpetas
function packageToPath(basePackage: string): string {
  return basePackage.replace(/\./g, '/');
}
// Descarga un archivo Blob como .zip
function downloadZip(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}
// Genera la estructura de carpetas y archivos Spring Boot y retorna un JSZip
function generateSpringBootZip(snapshot: any, projectName: string): Promise<JSZip> {
  const basePackage = toBasePackage(projectName);
  const packagePath = packageToPath(basePackage);
  const zip = new JSZip();
  // Estructura base
  zip.file(`${projectName}/pom.xml`, generatePomXml(projectName, basePackage));
  zip.file(`${projectName}/README.md`, generateReadme(projectName));
  zip.file(`${projectName}/src/main/resources/application.yml`, generateApplicationYml());
  // Clase principal de Spring Boot
  const applicationClassName = toCamelCase(projectName) + 'Application';
  zip.file(`${projectName}/src/main/java/${packagePath}/${applicationClassName}.java`, `package ${basePackage};\n\n` + generateMainApplicationJava(applicationClassName));
  // Código fuente Java
  const javaBase = `${projectName}/src/main/java/${packagePath}`;
  // Entidades, repos, servicios, controladores, DTOs, mappers
  for (const cls of snapshot.classes) {
    const entityName = toCamelCase(cls.name);
    // Paquetes
    const entityPkg = `${basePackage}.entity`;
    const repoPkg = `${basePackage}.repository`;
    const servicePkg = `${basePackage}.service`;
    const controllerPkg = `${basePackage}.controller`;
    const dtoPkg = `${basePackage}.dto`;
    const mapperPkg = `${basePackage}.mapper`;
    // Archivos con package y nombres CamelCase
    zip.file(`${javaBase}/entity/${entityName}.java`, `package ${entityPkg};\n\n` + generateEntityJava({ ...cls, name: entityName }, snapshot.classes.map((c: any) => ({ ...c, name: toCamelCase(c.name) })), snapshot.relations, basePackage));
    zip.file(`${javaBase}/repository/${entityName}Repository.java`, `package ${repoPkg};\n\n` + generateRepositoryJava(entityName, basePackage));
    zip.file(`${javaBase}/service/${entityName}Service.java`, `package ${servicePkg};\n\n` + generateServiceCrudJava(entityName, basePackage));
    zip.file(`${javaBase}/controller/${entityName}Controller.java`, `package ${controllerPkg};\n\n` + generateControllerCrudJava(entityName, basePackage));
    zip.file(`${javaBase}/dto/${entityName}Request.java`, `package ${dtoPkg};\n\n` + generateDtoRequestJava({ ...cls, name: entityName }, entityName, basePackage));
    zip.file(`${javaBase}/dto/${entityName}Response.java`, `package ${dtoPkg};\n\n` + generateDtoResponseJava({ ...cls, name: entityName }, entityName, basePackage));
    zip.file(`${javaBase}/mapper/${entityName}Mapper.java`, `package ${mapperPkg};\n\n` + generateMapperJava({ ...cls, name: entityName }, entityName, basePackage));
  }
  return Promise.resolve(zip);
}
// Utilidad para capitalizar el nombre del proyecto como package base
function toBasePackage(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .join('.');
}

// Genera el contenido de pom.xml
function generatePomXml(projectName: string, basePackage: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${basePackage}</groupId>
  <artifactId>${projectName}</artifactId>
  <version>1.0.0</version>
  <packaging>jar</packaging>
  <name>${projectName}</name>
  <description>Backend generado automáticamente desde UML</description>
  <properties>
    <java.version>21</java.version>
    <spring-boot.version>3.2.5</spring-boot.version>
  </properties>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.5</version>
    <relativePath/>
  </parent>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springdoc</groupId>
      <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
      <version>2.5.0</version>
    </dependency>
    <dependency>
      <groupId>jakarta.validation</groupId>
      <artifactId>jakarta.validation-api</artifactId>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
`;
}

// Genera el contenido de README.md
function generateReadme(projectName: string): string {
  return `# ${projectName}

Backend Spring Boot generado automáticamente desde un diagrama UML.

## Requisitos
- Java 21
- Maven 3.9+

## Cómo ejecutar

mvn spring-boot:run

## Documentación OpenAPI

Accede a la documentación Swagger en: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
`;
}

// Genera el contenido de application.yml
function generateApplicationYml(): string {
  return `spring:\n  datasource:\n    url: jdbc:h2:file:./data/testdb\n    driver-class-name: org.h2.Driver\n    username: sa\n    password:\n  jpa:\n    hibernate:\n      ddl-auto: update\n    show-sql: true\n    database-platform: org.hibernate.dialect.H2Dialect\n  h2:\n    console:\n      enabled: true\nserver:\n  port: 8080\n`;
}

// Genera la clase principal de Spring Boot Application
function generateMainApplicationJava(applicationClassName: string): string {
  return `import org.springframework.boot.SpringApplication;\n` +
    `import org.springframework.boot.autoconfigure.SpringBootApplication;\n\n` +
    `@SpringBootApplication\n` +
    `public class ${applicationClassName} {\n` +
    `    public static void main(String[] args) {\n` +
    `        SpringApplication.run(${applicationClassName}.class, args);\n` +
    `    }\n` +
    `}\n`;
}

// Genera el código Java de un servicio con métodos CRUD usando repositorio y mapper
function generateServiceCrudJava(entityName: string, basePackage?: string): string {
  const pkg = basePackage || 'back';
  return `import org.springframework.stereotype.Service;\n` +
    `import org.springframework.transaction.annotation.Transactional;\n` +
    `import java.util.List;\n` +
    `import java.util.stream.Collectors;\n` +
    `import ${pkg}.entity.${entityName};\n` +
    `import ${pkg}.dto.${entityName}Request;\n` +
    `import ${pkg}.dto.${entityName}Response;\n` +
    `import ${pkg}.repository.${entityName}Repository;\n` +
    `import ${pkg}.mapper.${entityName}Mapper;\n` +
    `@Service\n` +
    `public class ${entityName}Service {\n` +
    `    private final ${entityName}Repository repository;\n` +
    `    private final ${entityName}Mapper mapper;\n\n` +
    `    public ${entityName}Service(${entityName}Repository repository, ${entityName}Mapper mapper) {\n` +
    `        this.repository = repository;\n` +
    `        this.mapper = mapper;\n` +
    `    }\n\n` +
    `    @Transactional\n` +
    `    public void create(${entityName}Request request) {\n` +
    `        var entity = mapper.toEntity(request);\n` +
    `        repository.save(entity);\n` +
    `    }\n\n` +
    `    public ${entityName}Response getById(Long id) {\n` +
    `        var entity = repository.findById(id).orElseThrow(() -> new RuntimeException(\"Not found\"));\n` +
    `        return mapper.toResponse(entity);\n` +
    `    }\n\n` +
    `    public List<${entityName}Response> listAll() {\n` +
    `        return repository.findAll().stream().map(mapper::toResponse).collect(Collectors.toList());\n` +
    `    }\n\n` +
    `    @Transactional\n` +
    `    public void update(Long id, ${entityName}Request request) {\n` +
    `        var entity = repository.findById(id).orElseThrow(() -> new RuntimeException(\"Not found\"));\n` +
    `        // Actualizar campos desde el request\n` +
    `        repository.save(entity);\n` +
    `    }\n\n` +
    `    @Transactional\n` +
    `    public void delete(Long id) {\n` +
    `        repository.deleteById(id);\n` +
    `    }\n` +
    `}\n`;
}

// Genera el código Java de un controlador REST CRUD usando DTOs y mappers
function generateControllerCrudJava(entityName: string, basePackage?: string): string {
  const lower = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  const pkg = basePackage || 'back';
  return `import org.springframework.web.bind.annotation.*;\n` +
    `import org.springframework.http.ResponseEntity;\n` +
    `import java.util.List;\n` +
    `import ${pkg}.dto.${entityName}Request;\n` +
    `import ${pkg}.dto.${entityName}Response;\n` +
    `import ${pkg}.service.${entityName}Service;\n` +
    `@RestController\n` +
    `@RequestMapping(\"/api/${lower}\")\n` +
    `public class ${entityName}Controller {\n` +
    `    private final ${entityName}Service service;\n\n` +
    `    public ${entityName}Controller(${entityName}Service service) {\n` +
    `        this.service = service;\n` +
    `    }\n\n` +
    `    @PostMapping\n` +
    `    public ResponseEntity<Void> create(@RequestBody ${entityName}Request request) {\n` +
    `        service.create(request);\n` +
    `        return ResponseEntity.status(201).build();\n` +
    `    }\n\n` +
    `    @GetMapping(\"/{id}\")\n` +
    `    public ResponseEntity<${entityName}Response> getById(@PathVariable Long id) {\n` +
    `        return ResponseEntity.ok(service.getById(id));\n` +
    `    }\n\n` +
    `    @GetMapping\n` +
    `    public ResponseEntity<List<${entityName}Response>> listAll() {\n` +
    `        return ResponseEntity.ok(service.listAll());\n` +
    `    }\n\n` +
    `    @PutMapping(\"/{id}\")\n` +
    `    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody ${entityName}Request request) {\n` +
    `        service.update(id, request);\n` +
    `        return ResponseEntity.ok().build();\n` +
    `    }\n\n` +
    `    @DeleteMapping(\"/{id}\")\n` +
    `    public ResponseEntity<Void> delete(@PathVariable Long id) {\n` +
    `        service.delete(id);\n` +
    `        return ResponseEntity.noContent().build();\n` +
    `    }\n` +
    `}\n`;
}
// Genera DTO Request para una entidad
function generateDtoRequestJava(cls: any, entityName?: string, basePackage?: string): string {
  const pkg = basePackage || 'back';
  let imports = [
    'import jakarta.validation.constraints.*;'
  ];
  // Importar entidades si algún atributo es una entidad
  for (const attr of cls.attributes) {
    if (attr.typeName && /^[A-Z]/.test(attr.typeName)) {
      imports.push(`import ${pkg}.entity.${attr.typeName};`);
    }
  }
  let code = imports.join('\n') + '\n\n';
  const className = entityName || toCamelCase(cls.name);
  code += `public class ${className}Request {\n`;
  // Campos
  for (const attr of cls.attributes) {
    if (attr.isRequired) code += '    @NotNull\n';
    if (attr.typeName === 'string' && attr.maxLength) code += `    @Size(max = ${attr.maxLength})\n`;
    code += `    private ${mapType(attr.typeName)} ${attr.name};\n`;
  }
  code += '\n    public ' + className + 'Request() {}\n';
  // Getters y setters
  for (const attr of cls.attributes) {
    const type = mapType(attr.typeName);
    const name = attr.name;
    const camel = name.charAt(0).toUpperCase() + name.slice(1);
    code += `\n    public ${type} get${camel}() { return this.${name}; }\n`;
    code += `    public void set${camel}(${type} ${name}) { this.${name} = ${name}; }\n`;
  }
  code += '}\n';
  return code;
}

// Genera DTO Response para una entidad
function generateDtoResponseJava(cls: any, entityName?: string, basePackage?: string): string {
  const className = entityName || toCamelCase(cls.name);
  const pkg = basePackage || 'back';
  let imports = [];
  for (const attr of cls.attributes) {
    if (attr.typeName && /^[A-Z]/.test(attr.typeName)) {
      imports.push(`import ${pkg}.entity.${attr.typeName};`);
    }
  }
  let code = imports.length ? imports.join('\n') + '\n\n' : '';
  code += `public class ${className}Response {\n`;
  // Campos
  for (const attr of cls.attributes) {
    code += `    private ${mapType(attr.typeName)} ${attr.name};\n`;
  }
  code += '\n    public ' + className + 'Response() {}\n';
  // Getters y setters
  for (const attr of cls.attributes) {
    const type = mapType(attr.typeName);
    const name = attr.name;
    const camel = name.charAt(0).toUpperCase() + name.slice(1);
    code += `\n    public ${type} get${camel}() { return this.${name}; }\n`;
    code += `    public void set${camel}(${type} ${name}) { this.${name} = ${name}; }\n`;
  }
  code += '}\n';
  return code;
}

// Genera un mapper manual simple para una entidad
function generateMapperJava(cls: any, entityName?: string, basePackage?: string): string {
  entityName = entityName || toCamelCase(cls.name);
  const pkg = basePackage || 'back';
  let code = `import org.springframework.stereotype.Component;\n` +
    `import ${pkg}.entity.${entityName};\n` +
    `import ${pkg}.dto.${entityName}Request;\n` +
    `import ${pkg}.dto.${entityName}Response;\n\n` +
    `@Component\n` +
    `public class ${entityName}Mapper {\n`;
  // toEntity
  code += `    public ${entityName} toEntity(${entityName}Request dto) {\n`;
  code += `        if (dto == null) return null;\n`;
  code += `        ${entityName} entity = new ${entityName}();\n`;
  for (const attr of cls.attributes) {
    const type = mapType(attr.typeName);
    const name = attr.name;
    const camel = name.charAt(0).toUpperCase() + name.slice(1);
    code += `        entity.set${camel}(dto.get${camel}());\n`;
  }
  code += `        return entity;\n    }\n\n`;
  // toResponse
  code += `    public ${entityName}Response toResponse(${entityName} entity) {\n`;
  code += `        if (entity == null) return null;\n`;
  code += `        ${entityName}Response dto = new ${entityName}Response();\n`;
  for (const attr of cls.attributes) {
    const type = mapType(attr.typeName);
    const name = attr.name;
    const camel = name.charAt(0).toUpperCase() + name.slice(1);
    code += `        dto.set${camel}(entity.get${camel}());\n`;
  }
  code += `        return dto;\n    }\n`;
  code += `}\n`;
  return code;
}
// Genera el código Java de un repositorio Spring Data JPA para una entidad
function generateRepositoryJava(entityName: string, basePackage?: string): string {
  const pkg = basePackage || 'back';
  return `import org.springframework.data.jpa.repository.JpaRepository;\n` +
    `import org.springframework.stereotype.Repository;\n` +
    `import ${pkg}.entity.${entityName};\n\n` +
    `@Repository\n` +
    `public interface ${entityName}Repository extends JpaRepository<${entityName}, Long> {\n` +
    `}\n`;
}

// Genera el código Java de un servicio para una entidad
function generateServiceJava(entityName: string): string {
  return `import org.springframework.stereotype.Service;\n` +
    `import java.util.List;\n` +
    `@Service\n` +
    `public class ${entityName}Service {\n` +
    `    // Métodos CRUD pueden ser implementados aquí\n` +
    `}\n`;
}

// Genera el código Java de un controlador REST para una entidad
function generateControllerJava(entityName: string): string {
  const lower = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  return `import org.springframework.web.bind.annotation.*;\n` +
    `import java.util.List;\n` +
    `@RestController\n` +
    `@RequestMapping(\"/api/${lower}\")\n` +
    `public class ${entityName}Controller {\n` +
    `    // Métodos CRUD pueden ser implementados aquí\n` +
    `}\n`;
}
// Utilidad para mapear tipos del snapshot a tipos Java
function mapType(type: string): string {
  switch (type) {
    case 'string': return 'String';
    case 'int': return 'Integer';
    case 'long': return 'Long';
    case 'boolean': return 'Boolean';
    case 'float': return 'Float';
    case 'double': return 'Double';
    case 'date': return 'LocalDate';
    case 'datetime': return 'LocalDateTime';
    case 'BigDecimal': return 'BigDecimal';
    default: return 'String';
  }
}

// Genera el código Java de una entidad a partir de una clase del snapshot, incluyendo relaciones ORM
function generateEntityJava(cls: any, allClasses: any[], allRelations: any[], basePackage?: string): string {
  const pkg = basePackage || 'back';
  let imports = [
    'import jakarta.persistence.*;',
    'import java.io.Serializable;'
  ];
  if (cls.attributes.some((a: any) => a.typeName === 'date')) imports.push('import java.time.LocalDate;');
  if (cls.attributes.some((a: any) => a.typeName === 'datetime')) imports.push('import java.time.LocalDateTime;');
  if (cls.attributes.some((a: any) => a.typeName === 'BigDecimal')) imports.push('import java.math.BigDecimal;');

  // Para relaciones bidireccionales
  const className = cls.name.replace(/\s+/g, '');
  const classId = cls.id;

  // Buscar relaciones donde esta clase es destino (ManyToOne)
  const manyToOneRels = allRelations.filter((rel: any) => rel.targetId === classId && rel.type === 'Asociación');
  // Buscar relaciones donde esta clase es origen (OneToMany)
  const oneToManyRels = allRelations.filter((rel: any) => rel.sourceId === classId && rel.type === 'Asociación');
  // Buscar relaciones N a N donde esta clase participa
  const manyToManyRels = allRelations.filter((rel: any) => rel.type === 'AsociaciónNtoN' && (rel.sourceId === classId || rel.targetId === classId));

  // Agregar imports de entidades relacionadas
  const relatedEntities = new Set<string>();
  for (const rel of [...manyToOneRels, ...oneToManyRels, ...manyToManyRels]) {
    const sourceClass = allClasses.find((c: any) => c.id === rel.sourceId);
    const targetClass = allClasses.find((c: any) => c.id === rel.targetId);
    if (sourceClass && sourceClass.name !== cls.name) relatedEntities.add(sourceClass.name.replace(/\s+/g, ''));
    if (targetClass && targetClass.name !== cls.name) relatedEntities.add(targetClass.name.replace(/\s+/g, ''));
  }
  for (const ent of relatedEntities) {
    imports.push(`import ${pkg}.entity.${ent};`);
  }

  let code = imports.join('\n') + '\n\n';
  code += '@Entity\n';
  code += `@Table(name = "${cls.name.replace(/\s+/g, '_').toLowerCase()}")\n`;
  code += `public class ${className} implements Serializable {\n`;
  code += '    private static final long serialVersionUID = 1L;\n\n';
  // Detectar el atributo PK y su tipo
  const pkAttr = cls.attributes.find((a: any) => a.isPrimaryKey);
  // Atributos simples
  for (const attr of cls.attributes) {
    if (attr.isPrimaryKey) {
      code += '    @Id\n';
      // Solo agregar @GeneratedValue si la PK es Long o Integer
      const pkType = mapType(attr.typeName);
      if (pkType === 'Long' || pkType === 'Integer') {
        code += '    @GeneratedValue(strategy = GenerationType.IDENTITY)\n';
      }
    }
    if (attr.isRequired) {
      code += '    @Column(nullable = false)\n';
    } else {
      code += '    @Column\n';
    }
    code += `    private ${mapType(attr.typeName)} ${attr.name};\n`;
  }
  // Relaciones ManyToOne (muchos de esta clase apuntan a uno de la otra)
  for (const rel of manyToOneRels) {
    const sourceClass = allClasses.find((c: any) => c.id === rel.sourceId);
    if (sourceClass) {
      const relName = sourceClass.name.replace(/\s+/g, '');
      code += `    @ManyToOne\n`;
      code += `    @JoinColumn(name = "${relName.toLowerCase()}_id")\n`;
      code += `    private ${relName} ${relName.charAt(0).toLowerCase() + relName.slice(1)};\n`;
    }
  }
  // Relaciones OneToMany (uno de esta clase tiene muchos de la otra)
  for (const rel of oneToManyRels) {
    const targetClass = allClasses.find((c: any) => c.id === rel.targetId);
    if (targetClass) {
      const relName = targetClass.name.replace(/\s+/g, '');
      code += `    @OneToMany(mappedBy = \"${className.charAt(0).toLowerCase() + className.slice(1)}\")\n`;
      code += `    private java.util.List<${relName}> ${relName.charAt(0).toLowerCase() + relName.slice(1)}List;\n`;
    }
  }
  // Relaciones ManyToMany (N a N)
  for (const rel of manyToManyRels) {
    const otherClassId = rel.sourceId === classId ? rel.targetId : rel.sourceId;
    const otherClass = allClasses.find((c: any) => c.id === otherClassId);
    if (otherClass) {
      const relName = otherClass.name.replace(/\s+/g, '');
      code += `    @ManyToMany\n`;
      code += `    @JoinTable(name = \"${rel.associationClassId ? rel.associationClassId.replace(/\s+/g, '_').toLowerCase() : relName.toLowerCase() + '_' + className.toLowerCase()}\",\n`;
      code += `        joinColumns = @JoinColumn(name = \"${className.toLowerCase()}_id\"),\n`;
      code += `        inverseJoinColumns = @JoinColumn(name = \"${relName.toLowerCase()}_id\")\n`;
      code += `    )\n`;
      code += `    private java.util.Set<${relName}> ${relName.charAt(0).toLowerCase() + relName.slice(1)}Set;\n`;
    }
  }
  // Constructor público sin argumentos
  code += '\n    public ' + className + '() {}\n';
  // Getters y setters para atributos simples
  for (const attr of cls.attributes) {
    const type = mapType(attr.typeName);
    const name = attr.name;
    const camel = name.charAt(0).toUpperCase() + name.slice(1);
    code += `\n    public ${type} get${camel}() { return this.${name}; }\n`;
    code += `    public void set${camel}(${type} ${name}) { this.${name} = ${name}; }\n`;
  }
  code += '}\n';
  return code;
}
import { Component } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
// @ts-ignore
import JSZip from 'jszip';

@Component({
  selector: 'app-diagram-export',
  standalone: true,
  imports: [CommonModule, JsonPipe, FormsModule],
  templateUrl: './diagram-export.component.html',
  styleUrl: './diagram-export.component.css'
})
export class DiagramExportComponent {
  snapshot: any = null;
  javaPreviews: { name: string, code: string }[] = [];
  repoPreviews: { name: string, code: string }[] = [];
  servicePreviews: { name: string, code: string }[] = [];
  controllerPreviews: { name: string, code: string }[] = [];
  dtoRequestPreviews: { name: string, code: string }[] = [];
  dtoResponsePreviews: { name: string, code: string }[] = [];
  mapperPreviews: { name: string, code: string }[] = [];
  serviceCrudPreviews: { name: string, code: string }[] = [];
  controllerCrudPreviews: { name: string, code: string }[] = [];

  projectName: string = '';

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.snapshot = nav?.extras?.state?.['snapshot'] || null;
    // Si hay snapshot y clases, genera la previsualización de todas
    if (this.snapshot && this.snapshot.classes && this.snapshot.classes.length > 0) {
      this.javaPreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name,
        code: generateEntityJava(cls, this.snapshot.classes, this.snapshot.relations)
      }));

      // Generar repos, services y controllers para cada entidad
      this.repoPreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Repository',
        code: generateRepositoryJava(cls.name.replace(/\s+/g, ''))
      }));
      this.servicePreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Service',
        code: generateServiceJava(cls.name.replace(/\s+/g, ''))
      }));
      this.controllerPreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Controller',
        code: generateControllerJava(cls.name.replace(/\s+/g, ''))
      }));

      // Generar DTOs y mappers para cada entidad
      this.dtoRequestPreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Request',
        code: generateDtoRequestJava(cls)
      }));
      this.dtoResponsePreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Response',
        code: generateDtoResponseJava(cls)
      }));
      this.mapperPreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Mapper',
        code: generateMapperJava(cls)
      }));

      // Generar servicios y controladores CRUD completos
      this.serviceCrudPreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Service (CRUD)',
        code: generateServiceCrudJava(cls.name.replace(/\s+/g, ''))
      }));
      this.controllerCrudPreviews = this.snapshot.classes.map((cls: any) => ({
        name: cls.name + 'Controller (CRUD)',
        code: generateControllerCrudJava(cls.name.replace(/\s+/g, ''))
      }));
    }
  }

  async onGenerateBackend() {
    const name = this.projectName && this.projectName.trim() ? this.projectName.trim() : 'modeler-generated';
    if (!this.snapshot || !this.snapshot.classes || this.snapshot.classes.length === 0) {
      alert('No hay snapshot válido para exportar.');
      return;
    }
    const zip = await generateSpringBootZip(this.snapshot, name);
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadZip(blob, `${name}.zip`);
  }
}
