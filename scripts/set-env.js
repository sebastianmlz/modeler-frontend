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
const apiUrl = process.env.API_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

// Solo generar archivos si estamos en un entorno de producción (Railway)
// Detectamos esto por la presencia de variables de entorno específicas de Railway
const isProductionEnvironment = apiUrl && (apiUrl.includes('railway.app') || apiUrl.includes('modeler'));

if (isProductionEnvironment) {
  console.log('🚀 Entorno de producción detectado - Generando archivos de environment...');
  
  const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}',
  wsUrl: '${getWebSocketUrl(apiUrl)}',
  geminiApiKey: '${geminiApiKey || ''}'
};
`;

  const prodConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${getWebSocketUrl(apiUrl)}',
  geminiApiKey: '${geminiApiKey || ''}'
};
`;

  // Crear directorio si no existe
  if (!fs.existsSync('./src/environments')) {
    fs.mkdirSync('./src/environments', { recursive: true });
  }

  fs.writeFileSync(targetPath, envConfigFile);
  fs.writeFileSync(prodTargetPath, prodConfigFile);

  console.log('✅ Archivos de environment generados para producción!');
} else {
  console.log('🏠 Entorno de desarrollo local detectado - Manteniendo archivos existentes');
  console.log('📝 Los archivos environment.ts y environment.prod.ts no se modificarán');
}