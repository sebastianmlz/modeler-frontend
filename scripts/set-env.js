const fs = require('fs');
const path = require('path');

// Configuración de entornos
const targetPath = './src/environments/environment.ts';
const prodTargetPath = './src/environments/environment.prod.ts';

// Función para convertir HTTP URL a WebSocket URL
function getWebSocketUrl(apiUrl) {
  if (!apiUrl) return '';
  return apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
}

// Variables de entorno de Railway
const apiUrl = process.env.API_URL || 'http://localhost:8000';
const prodApiUrl = process.env.API_URL;

const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}',
  wsUrl: '${getWebSocketUrl(apiUrl)}',
  geminiApiKey: '${process.env.GEMINI_API_KEY}'
};
`;

const prodConfigFile = `export const environment = {
  production: true,
  apiUrl: '${prodApiUrl}',
  wsUrl: '${getWebSocketUrl(prodApiUrl)}',
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