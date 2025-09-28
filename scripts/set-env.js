const fs = require('fs');
const path = require('path');

// Configuración de entornos
const targetPath = './src/environments/environment.ts';
const prodTargetPath = './src/environments/environment.prod.ts';

// Variables de entorno de Railway
const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '${process.env.API_URL || 'http://localhost:8000'}',
  geminiApiKey: '${process.env.GEMINI_API_KEY}'
};
`;

const prodConfigFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL}',
  geminiApiKey: '${process.env.GEMINI_API_KEY}'
};
`;

// Escribir archivos de configuración
console.log('Generando archivos de environment...');

if (!fs.existsSync('./src/environments')) {
  fs.mkdirSync('./src/environments', { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
fs.writeFileSync(prodTargetPath, prodConfigFile);

console.log('Archivos de environment generados exitosamente!');