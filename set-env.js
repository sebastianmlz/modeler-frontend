const fs = require('fs');
const path = require('path');

// Obtener variables de entorno o usar valores por defecto
const apiUrl = process.env.API_URL || 'https://modeler-backend-production.up.railway.app';
const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyD-zloEOPIz5onu6wdxgfHZwt10J33Dqek';

// Ruta del archivo environment.prod.ts
const envPath = path.join(__dirname, 'src/environments/environment.prod.ts');

// Contenido del archivo environment
const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  geminiApiKey: '${geminiApiKey}'
};
`;

// Escribir el archivo
fs.writeFileSync(envPath, content, 'utf8');
console.log('✅ environment.prod.ts generado con variables de entorno');
console.log(`   API_URL: ${apiUrl}`);
console.log(`   GEMINI_API_KEY: ${geminiApiKey ? '***configurado***' : 'no configurado'}`);