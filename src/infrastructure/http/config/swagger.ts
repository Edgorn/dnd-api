import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'D&D API',
      version: '1.0.0',
      description: 'Documentación de la API para gestión de campañas y fichas de D&D',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Introduce el token JWT recibido en el login (sin el prefijo "Bearer ")'
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Rutas relativas para buscar comentarios JSDoc
  apis: [
    './src/infrastructure/http/routes/*.ts',
    './src/infrastructure/http/routes/*.js'
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

// Generar archivo openapi.json estático en la raíz del proyecto
import fs from 'fs';
import path from 'path';

try {
  const outputPath = path.join(__dirname, '../../../../openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
} catch (error) {
  console.error('❌ Error al escribir openapi.json:', error);
}
