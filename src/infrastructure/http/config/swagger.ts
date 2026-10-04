import fs from "fs";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "D&D API",
      version: "1.0.0",
      description: "Documentación de la API para gestión de campañas y fichas de D&D"
    },
    servers: [
      {
        url: "http://localhost:8000",
        description: "Servidor Local"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Introduce el token JWT recibido en el login (sin el prefijo \"Bearer \")"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    "./src/infrastructure/http/routes/*.ts",
    "./src/infrastructure/http/routes/*.js"
  ]
};

export function generateSwaggerSpec(): object {
  return swaggerJSDoc(options);
}

export function writeOpenApiJson(cwd: string = process.cwd()): string {
  const swaggerSpec = generateSwaggerSpec();
  const outputPath = path.resolve(cwd, "openapi.json");
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), "utf-8");
  return outputPath;
}

function isExecutedAsCli(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  const normalized = entry.replace(/\\/g, "/");
  return normalized.endsWith("/swagger.ts") || normalized.endsWith("/swagger.js");
}

if (isExecutedAsCli()) {
  try {
    const outputPath = writeOpenApiJson();
    console.log(`openapi.json generado en: ${outputPath}`);
  } catch (error) {
    console.error("Error al escribir openapi.json:", error);
    process.exitCode = 1;
  }
}
