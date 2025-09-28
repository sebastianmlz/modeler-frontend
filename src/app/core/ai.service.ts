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
   * Genera sugerencias para el diagrama UML basado en el snapshot actual
   */
  generateUMLSuggestions(snapshot: any): Observable<UMLSuggestionsResponse> {
    const contextRules = this.getUMLContextRules();
    const prompt = this.buildUMLSuggestionPrompt(snapshot, contextRules);
    
    return this.submitPrompt(prompt).pipe(
      map(response => this.parseUMLSuggestionsResponse(response))
    );
  }

  /**
   * Procesa un comando de voz para modificar el diagrama UML
   */
  processVoiceCommand(snapshot: any, voiceCommand: string): Observable<UMLSuggestionsResponse> {
    const contextRules = this.getUMLContextRules();
    const prompt = this.buildVoiceCommandPrompt(snapshot, voiceCommand, contextRules);
    
    return this.submitPrompt(prompt).pipe(
      map(response => this.parseUMLSuggestionsResponse(response))
    );
  }

  /**
   * Construye el prompt específico para comandos de voz
   */
  private buildVoiceCommandPrompt(snapshot: any, voiceCommand: string, contextRules: string): string {
    return `
Eres un experto en modelado UML. El usuario te ha dado un comando por voz para modificar su diagrama UML. Debes interpretar exactamente lo que el usuario quiere hacer y generar los cambios necesarios.

CONTEXTO DE REGLAS DEL PROYECTO:
${contextRules}

DIAGRAMA ACTUAL:
${JSON.stringify(snapshot, null, 2)}

COMANDO DEL USUARIO (por voz):
"${voiceCommand}"

INSTRUCCIONES:
1. Interpreta el comando del usuario y determina qué cambios hacer en el diagrama
2. Si el usuario pide crear clases, genera las clases con atributos apropiados
3. Si pide agregar atributos, identifica la clase correcta y agrega los atributos
4. Si pide crear relaciones, identifica las clases y el tipo de relación
5. Si pide editar algo existente, modifica los elementos correspondientes
6. Genera un resumen claro de lo que hiciste

FORMATO DE RESPUESTA REQUERIDO:
Responde ÚNICAMENTE con un objeto JSON válido sin bloques de código markdown ni texto adicional.

{
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
  "summary": "Resumen de las acciones realizadas según el comando de voz"
}

EJEMPLOS DE COMANDOS:
- "Crea una clase Usuario con nombre, email y edad" → Crear nueva clase con esos atributos
- "Agrega teléfono a Usuario" → Agregar atributo a clase existente
- "Relaciona Usuario con Pedido uno a muchos" → Crear relación entre clases
- "Cambia el nombre de Usuario a Cliente" → Modificar nombre de clase

REGLAS IMPORTANTES:
- NO uses bloques de código markdown
- Responde solo JSON puro
- Si no entiendes el comando, crea una sugerencia de tipo "warning" explicando el problema
- Siempre incluye un resumen claro de lo que hiciste
- Para clases nuevas, usa IDs temporales únicos como "temp_class_[nombre]" 
- Para relaciones entre clases nuevas y existentes, usa el ID temporal de la clase nueva
- Asegúrate de que cada clase nueva tenga al menos un atributo marcado como isPrimaryKey: true
- Si creas múltiples clases, usa IDs temporales diferentes para cada una`;
  }

  /**
   * Construye el prompt específico para sugerencias UML
   */
  private buildUMLSuggestionPrompt(snapshot: any, contextRules: string): string {
    return `
Eres un experto en modelado UML y diseño de bases de datos. Analiza el siguiente diagrama UML y proporciona sugerencias específicas y justificadas.

CONTEXTO DE REGLAS DEL PROYECTO:
${contextRules}

SNAPSHOT ACTUAL DEL DIAGRAMA:
${JSON.stringify(snapshot, null, 2)}

INSTRUCCIONES:
1. Analiza las clases existentes y sugiere atributos relevantes basados en buenas prácticas
2. Identifica relaciones faltantes o incorrectas entre las clases
3. Detecta inconsistencias, redundancias o errores en el modelo
4. Sugiere mejoras estructurales (normalización, entidades intermedias, etc.)

FORMATO DE RESPUESTA REQUERIDO:
Responde ÚNICAMENTE con un objeto JSON válido sin bloques de código markdown ni texto adicional.

{
  "suggestions": [
    {
      "type": "attribute|relation|improvement|warning",
      "target": "ID_de_clase_o_relacion",
      "title": "Título breve de la sugerencia",
      "description": "Descripción detallada con justificación",
      "implementation": {
        "attributeToAdd": [
          { "name": "email", "typeName": "string", "isRequired": true, "isPrimaryKey": false }
        ],
        "attributeToModify": { "name": "ci", "propertyName": "isPrimaryKey", "newValue": false },
        "relationToAdd": { "sourceId": "clase1", "targetId": "clase2", "type": "Asociación", "sourceMultiplicity": "1", "targetMultiplicity": "*" }
      }
    }
  ],
  "summary": "Resumen general del análisis y recomendaciones"
}

REGLAS IMPORTANTES:
- Para múltiples atributos usar array en "attributeToAdd"
- Para modificar atributos existentes usar "attributeToModify"
- NO uses bloques de código markdown
- NO agregues texto explicativo fuera del JSON
- Responde solo JSON puro

EJEMPLO DE SUGERENCIAS:
- Para clase "Usuario": Sugerir atributo "email" (string, único) para autenticación
- Para clases "Pedido" y "Cliente": Sugerir relación "Cliente 1--* Pedido"
- Advertir sobre falta de claves primarias o relaciones inconsistentes`;
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
