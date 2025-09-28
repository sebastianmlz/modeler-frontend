const fs = require('fs');
const path = require('path');

// Obtener variables de entorno (obligatorias en Railway)
const apiUrl = process.env.API_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

// Validar que las variables estén configuradas
if (!apiUrl) {
  console.error('❌ Error: API_URL no está configurada en las variables de entorno');
  process.exit(1);
}

if (!geminiApiKey) {
  console.error('❌ Error: GEMINI_API_KEY no está configurada en las variables de entorno');
  process.exit(1);
}

// Ruta del directorio y archivo environment.prod.ts
const envDir = path.join(__dirname, 'src/environments');
const envPath = path.join(envDir, 'environment.prod.ts');

// Crear directorio si no existe
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

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