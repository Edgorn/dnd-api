# DnD-API

API REST para la gestión de campañas, personajes, conjuros, equipamientos y sistemas de reglas personalizados de Dragones y Mazmorras (D&D). El proyecto está estructurado siguiendo principios de **Arquitectura Hexagonal** y **Domain-Driven Design (DDD)**.

## 🛠️ Stack Tecnológico

- **Entorno de Ejecución:** Node.js (v22.12+)
- **Gestor de Paquetes:** pnpm
- **Lenguaje:** TypeScript (compilando a CommonJS/ES2021)
- **Framework Web:** Express (v5)
- **Base de Datos:** MongoDB con Mongoose (v9)
- **Validación de Datos:** Zod
- **Autenticación:** JWT y Bcrypt
- **Pruebas:** Vitest
- **Documentación:** Swagger / OpenAPI 3.0

## 📂 Requisitos Previos

- **Node.js** >= 22.12
- **pnpm** instalado globalmente (`npm i -g pnpm`)
- Instancia activa de **MongoDB** (local o en la nube a través de MongoDB Atlas)

## 🚀 Instalación y Configuración

1. Clonar el repositorio.
2. Instalar las dependencias del proyecto:
   ```bash
   pnpm install
   ```
3. Crear un archivo `.env` en la raíz del proyecto basándose en las siguientes variables obligatorias:
   ```env
   PORT=8000
   MONGO_URI=mongodb://localhost:27017/dnd-api
   JWT_SECRET=tu_secreto_para_tokens
   JWT_REFRESH_SECRET=tu_secreto_para_refresh_tokens
   ALLOWED_ORIGINS=http://localhost:3000
   ```

## 💻 Comandos del Proyecto

- **Iniciar en desarrollo (con recarga rápida):**
  ```bash
  pnpm dev
  ```
- **Compilar a producción (TypeScript a JavaScript):**
  ```bash
  pnpm build
  ```
- **Iniciar servidor en producción (compilado previamente):**
  ```bash
  pnpm start
  ```
- **Ejecutar Pruebas (Vitest):**
  ```bash
  pnpm test
  ```
- **Realizar Commit con IA (usando COMMIT_MESSAGE.md):**
  ```bash
  pnpm commit:ai
  ```

## 📖 Documentación de la API

La API cuenta con documentación interactiva de Swagger:
- Una vez iniciado el servidor en desarrollo (`pnpm dev`), accede a **[http://localhost:8000/api-docs](http://localhost:8000/api-docs)** en tu navegador para ver la interfaz interactiva.
- Para regenerar el archivo JSON estático de OpenAPI:
  ```bash
  pnpm exec tsx src/infrastructure/http/config/swagger.ts
  ```
