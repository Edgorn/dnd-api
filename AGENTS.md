# Guía para Agentes (Contexto del Proyecto)

Este archivo sirve como referencia principal para agentes de IA (y desarrolladores) sobre la arquitectura, el stack tecnológico y las convenciones de este proyecto.

## 🛠️ Stack Tecnológico

- **Entorno y Gestor de Paquetes:** Node.js con **pnpm** (obligatorio usar siempre `pnpm` en lugar de `npm` o `yarn`).
- **Lenguaje:** TypeScript (`tsx` para desarrollo, `tsc` para compilación a CommonJS / ES2021).
- **Framework Web:** Express (v5)
- **Base de Datos:** MongoDB con Mongoose (v9)
- **Validaciones:** Zod
- **Autenticación:** JWT (`jsonwebtoken`) y `bcrypt` para encriptar contraseñas.
- **Otros:** `multer` para subida de archivos, `pdf-lib` para manipular PDFs, `cors`, `dotenv`, `swagger-ui-express`, `swagger-jsdoc` (para documentación OpenAPI).

## 📂 Estructura de Carpetas

El proyecto implementa principios de **Arquitectura Hexagonal / Domain-Driven Design (DDD)**. Todo el código fuente está dentro de `src/`:

- `src/domain/`: Lógica de negocio core y abstracciones.
  - `services/`: Interfaces y lógica de dominio agnóstica a infraestructura.
  - `types/`: Definiciones de tipos e interfaces TypeScript.
- `src/application/`: Casos de uso del sistema.
  - `use-cases/`: Clases que orquestan las llamadas entre el dominio y los repositorios para ejecutar tareas específicas (ej. `crearCampaña`, `login`).
- `src/infrastructure/`: Detalles de implementación técnica externa al dominio.
  - `http/`: Relacionado con Express (controladores, rutas, middlewares, esquemas Zod y arranque del servidor).
  - `databases/mongoDb/`: Modelos de Mongoose e implementaciones concretas de los repositorios.
  - `dependencies.ts`: Archivo crucial. Se utiliza para inyección de dependencias manual (IoC Container). Instancia repositorios, los inyecta en servicios, estos en casos de uso, y finalmente los casos de uso en controladores.
- `src/utils/`: Funciones utilitarias generales.

## 📝 Reglas de Código y Convenciones (Cómo Programar Aquí)

Cuando vayas a crear o modificar código en este repositorio, sigue estrictamente estas reglas:

1. **Inyección de Dependencias (DI):**
   - Usa clases e inyecta las dependencias a través del constructor.
   - Ejemplo: `constructor(private readonly miUseCase: MiUseCase) {}`.
   - **IMPORTANTE:** Siempre que crees un nuevo repositorio, servicio, caso de uso o controlador, DEBES instanciarlo y encadenarlo correctamente en `src/infrastructure/dependencies.ts`.

2. **Controladores (Controllers):**
   - Define los métodos de los controladores como funciones flecha asignadas a propiedades de la clase para preservar el contexto de `this` (ej. `login = async (req: Request, res: Response) => { ... }`).
   - Envuelve el cuerpo de los métodos en un bloque `try/catch`.
   - Maneja los errores de forma explícita retornando respuestas JSON estructuradas: `res.status(500).json({ error: 'Mensaje' })`.
   - Usa `console.error()` o `console.warn()` para dejar trazas antes de enviar un error al cliente.

3. **Arquitectura Hexagonal / DDD:**
   - **Los Casos de Uso (`application/use-cases/`)** deben orquestar la lógica. Solo deben comunicarse con los servicios de dominio o repositorios inyectados, sin acoplarse a Express (`req`, `res`).
   - **Los Repositorios (`infrastructure/databases/mongoDb/repositories/`)** encapsulan toda la lógica específica de Mongoose. No expongas objetos o métodos de Mongoose en capas superiores. Además, **respeta la arquitectura hexagonal**: un repositorio no debe importar y usar directamente el Modelo/Schema de Mongoose que pertenezca a otra entidad. Si necesitas datos de otra entidad, inyecta su respectivo repositorio a través del constructor.
   - **El Dominio (`domain/`)** no debe tener dependencias de infraestructura (ni Express, ni Mongoose, etc.).

4. **Validaciones:**
   - Para las peticiones HTTP (cuerpos, parámetros, queries), utiliza **Zod**. Los esquemas se ubican normalmente cerca de la infraestructura (ej. `src/infrastructure/http/schemas/`).

5. **Tipado Estratégico:**
   - Asegúrate de definir las firmas de los métodos y usar los tipos adecuadamente sin abusar del tipo `any`.

6. **Manejo de Rulesets y Relaciones Multitabla/Sistema (ej. Características):**
   - Ciertas entidades (como `Caracteristica`) tienen una relación de muchos a muchos con los sistemas a través del campo `ruleset: string[]`.
   - **Creación:** Al crearlas desde una vista de sistema, se les pasa un único `ruleset` como `string`. El repositorio debe envolver este string en un array `[ruleset]` al insertarlo en la base de datos.
   - **Edición y Relación:** Para añadir o quitar una entidad de un sistema, se usan operaciones atómicas de MongoDB (`$addToSet` para añadir sin duplicados, `$pull` para quitar) sobre el array `ruleset`.
   - **Consulta de Sistemas:** Al consultar un sistema (`SystemApi`), este debe retornar el listado completo de características asociadas a él, buscando documentos donde el `ruleset` contenga el ID del sistema o su nombre.

7. **Documentación de la API (Swagger / OpenAPI):**
   - Siempre que se realice un desarrollo nuevo que modifique o añada endpoints, parámetros de petición o esquemas de respuesta, se debe actualizar la documentación Swagger (usando comentarios `@openapi`) en los archivos correspondientes dentro de `src/infrastructure/http/routes/*.routes.ts`.
   - Tras realizar las modificaciones de Swagger, es obligatorio regenerar el archivo `openapi.json` estático en la raíz ejecutando el comando:
     ```bash
     pnpm exec tsx src/infrastructure/http/config/swagger.ts
     ```

8. **Idioma (Inglés vs Spanglish):** Se ha decidido abandonar el uso del Spanglish en el código y decantarse por el Inglés. Todo el código nuevo, nombres de variables, archivos, esquemas e interfaces deben declararse estrictamente en Inglés (ej. Attribute en lugar de Caracteristica). 

9. **Registro del Desarrollo (COMMIT_MESSAGE.md):**
   - Cuando se haga un desarrollo se debe crear (en caso de no existir) un archivo `COMMIT_MESSAGE.md` en la raíz del proyecto.
   - En este archivo se debe escribir un resumen del desarrollo, cuyo contenido será el texto que irá en el commit de git.
   - En caso de ya existir el archivo, se debe añadir la información del nuevo desarrollo al final. Si el nuevo desarrollo tiene relación directa con lo que ya estaba escrito en el archivo, se puede modificar o ampliar el texto existente para añadir más detalles.
   - Este archivo debe estar excluido en el archivo `.gitignore` (como `/COMMIT_MESSAGE.md`).
