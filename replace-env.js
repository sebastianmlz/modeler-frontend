const fs = require('fs');
const path = require('path');

// Leer el archivo environment.prod.ts
const envProdPath = path.join(__dirname, 'src/environments/environment.prod.ts');
let envContent = fs.readFileSync(envProdPath, 'utf8');

// Reemplazar valores con variables de entorno
envContent = envContent.replace(
  /apiUrl:\s*'[^']*'/,
  `apiUrl: '${process.env.API_URL || 'https://modeler-backend-production.up.railway.app'}'`
);

envContent = envContent.replace(
  /geminiApiKey:\s*'[^']*'/,
  `geminiApiKey: '${process.env.GEMINI_API_KEY || 'placeholder'}'`
);

// Escribir el archivo actualizado
fs.writeFileSync(envProdPath, envContent);
console.log('✅ Variables de entorno inyectadas en environment.prod.ts');