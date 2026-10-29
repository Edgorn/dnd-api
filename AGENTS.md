# AGENTS.md — API D&D (backend)

API REST para gestionar sistemas de reglas de rol (D&D y derivados), campañas y personajes. Arquitectura hexagonal / DDD sobre Express y MongoDB.

## Stack y estructura

- Node.js >= 22.12 + pnpm (User Rules). TypeScript 7: `tsx` en desarrollo, `tsc` a CommonJS / ES2021.
- Express 5, MongoDB + Mongoose 9, Zod 4, JWT (`jsonwebtoken`) + `bcrypt`, Vitest. También `pdf-lib` (PDFs) y `swagger-ui-express`. `swagger-jsdoc` es solo de desarrollo (genera `openapi.json`).
- `src/domain/`: modelos, errores (`AppError`), tipos, servicios de dominio. Sin dependencias de infraestructura.
  - `ports/`: contratos de servicios no ligados a entidades (`IPasswordHasher`, `ITokenService`, `IUserCache`).
  - `repositories/`: interfaces de repositorio por entidad (`IAttributeRepository`).
- `src/application/use-cases/`: casos de uso que orquestan dominio y repositorios.
- `src/infrastructure/`: adaptadores. `databases/mongoDb/` (schemas y repositorios Mongoose), `http/` (controllers, middlewares, schemas Zod, routes), `security/`, `cache/`, `config/`, `defaultApi/`.
- `src/infrastructure/dependencies.ts`: contenedor IoC manual. Instancia repositorios, servicios, casos de uso y controladores.
- `.env` en la raíz: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

## Comandos

- Instalar: `pnpm install`
- Desarrollo (watch): `pnpm dev`
- Tests: `pnpm test`
- Build: `pnpm build` (`tsc` a `dist/`)
- Producción: `pnpm start` (`dist/app.js`)
- Regenerar `openapi.json`: `pnpm docs:openapi`
- Commit con el mensaje preparado: `pnpm commit:ai` (usa `COMMIT_MESSAGE.md` y luego lo borra)
- No hay linter configurado.

## Convenciones y patrones

- **Idioma:** código nuevo (variables, archivos, schemas, interfaces) en inglés (`Attribute`, no `Caracteristica`). Swagger en español. El código legacy en Spanglish (`IClaseRepository`, `ICriaturaRepository`...) no se renombra salvo petición explícita o refactor de esa entidad.
- **DI:** clases con dependencias por constructor (`constructor(private readonly myUseCase: MyUseCase) {}`). Todo repositorio, servicio, caso de uso o controlador nuevo se cablea en `dependencies.ts`.
- **Controllers:** métodos como funciones flecha (`login = async (req, res) => {...}`) con `try/catch`. Lanzar `AppError` (`src/domain/errors/AppError.ts`) y delegar la respuesta en `src/infrastructure/http/middlewares/errorHandler.middleware.ts` (o responder estructurado en el catch si hace falta control local). Trazar con `console.error` / `console.warn` antes de propagar.
- **Capas:** los casos de uso no conocen Express (`req`, `res`). Los repositorios encapsulan Mongoose y no lo exponen hacia arriba. El dominio no importa Express ni Mongoose.
- **Validación:** Zod para body, params y query, en `src/infrastructure/http/schemas/`.
- **REST PUT/PATCH:** el `id` va en la URL (`PUT /recurso/:id`), nunca en el body. El schema Zod no exige `id`; el controller combina `req.params.id` con `req.body` antes del caso de uso.
- **Swagger:** todo endpoint, parámetro o respuesta nuevos o modificados se documentan con `@openapi` en `src/infrastructure/http/routes/*.routes.ts`, en español (resúmenes, descripciones, tags y mensajes). Después, regenerar `openapi.json`.
- **Entidad nueva:** skill `/new-entity` (copia Attribute). Subagente `/backend`; modo chat `/back` (Alt+Enter).

## Reglas de dominio y trampas

- **Rulesets (1 a N):** cada entidad (`Attribute`, `Skill`, `Language`...) pertenece a un solo sistema mediante `ruleset: string`. Para compartir entre sistemas se usa la herencia de sistemas (un hijo ve las entidades de sus ancestros). `getBySystems` recoge los ancestros y filtra con `ruleset: { $in: expandedRulesets }`.
- **Soft delete:** siempre con `deletedAt: Date | null` (schema: `deletedAt: { type: Date, default: null }`), como en `attributes`, `skills` y `systems`. Las lecturas filtran `{ deletedAt: null }`. Endpoints `DELETE /recurso/:id` y, opcionalmente, `PATCH /recurso/:id/restore`.
- **Campo `index` obsoleto:** usar solo el `id` de MongoDB. Sin `index` en schemas Mongoose, interfaces ni Zod. Al refactorizar una entidad legacy, quitarlo de todas las capas y verificar que se eliminan los índices residuales (`index_1`, `ruleset_1_index_1`).
- **Datos legacy:** `.lean()` devuelve los documentos tal cual están guardados. Si cambia la forma de un campo (por ejemplo, `money` de objeto a array), el repositorio normaliza al leer (`formatear...`, `Array.isArray()`, comprobar propiedades antiguas) antes de usar `.map()` / `.filter()`.
- **Repositorios:** nada de cachés en memoria (`Map`, `Record`, arrays locales) para entidades; toda consulta va a MongoDB (hay múltiples réplicas). Un repositorio no importa el modelo Mongoose de otra entidad; si necesita sus datos, recibe su repositorio por constructor.
- **Lógica entre entidades** (estadísticas cruzadas, borrado en cascada...): va en un caso de uso orquestador en `application/` que inyecta los repositorios o servicios implicados, no en un repositorio.

## Forma de trabajar

- pnpm y `COMMIT_MESSAGE.md`: User Rules. El archivo de este repo es `./COMMIT_MESSAGE.md`.
- **Wiki** (`wiki/DungeonsAndDragons/`): no documentar cada desarrollo. Entidad de catálogo nueva → nota con `99 Plantillas/Plantilla entidad.md` (seguir `wiki/DungeonsAndDragons/AGENTS.md`). Decisión estructural → ADR. El resto: diario o nada. No copiar Swagger ni este archivo a la bóveda.
- Planificar antes de tocar código si el cambio afecta a varias entidades, cambia el formato de datos persistidos o requiere migración.
- Las skills de `.agents/` se usan cuando aplican; si contradicen este archivo, manda `AGENTS.md`.

## Límites

- **Siempre:** cablear en `dependencies.ts`; añadir tests (`.test.ts` / `.spec.ts`, Vitest) para cada caso de uso nuevo; actualizar Swagger y `openapi.json` si cambia la API.
- **Preguntar antes:** cambios en el formato de datos o en schemas persistidos; migraciones; renombrar código legacy.
- **Nunca:** cachés en memoria en repositorios; importar modelos Mongoose de otra entidad; añadir campos `index`.

## Verificación

- `pnpm test` en verde.
- `pnpm run build` con código de salida 0. Si `tsc` falla, corregir y repetir. El trabajo no está terminado aunque pasen los tests o arranque `pnpm dev`.
- Un build fallido significa que **falta un test** en el código afectado: tras arreglar la compilación, añadir o ampliar un test ahí para cubrir el caso.
