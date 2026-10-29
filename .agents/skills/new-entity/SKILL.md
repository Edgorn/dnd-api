---
name: new-entity
description: Crea una entidad de catálogo en apiDnd copiando Attribute (dominio, casos de uso, repo, Zod, controller, routes, IoC, tests, Swagger). Usar cuando el usuario escribe /new-entity o pide un CRUD/recurso nuevo de catálogo.
disable-model-invocation: true
---

# Nueva entidad (canónica Attribute)

Leer `AGENTS.md` y copiar la forma de Attribute. No inventar capas ni meter Mongoose en dominio.

## Archivos a leer y clonar

| Capa | Attribute |
|---|---|
| Dominio | `src/domain/types/attribute.types.ts`, `src/domain/services/attribute.service.ts`, `src/domain/repositories/IAttributeRepository.ts` |
| Casos de uso | `src/application/use-cases/attribute/` (`create`, `update`, `getAttributesBySystems`, `softDelete`, `restore`) |
| HTTP | `src/infrastructure/http/controllers/attribute.controller.ts`, `schemas/attribute.schema.ts`, `routes/attribute.routes.ts` |
| Persistencia | `src/infrastructure/databases/mongoDb/schemas/Attribute.ts`, `repositories/attribute.repository.ts` |
| IoC | cableado en `src/infrastructure/dependencies.ts` |
| Tests | `src/application/use-cases/attribute/*.test.ts` (y tests de dominio si Attribute los tiene) |

Código nuevo en inglés. Swagger y `COMMIT_MESSAGE.md` en español.

## Flujo

1. Tipos y puerto de repositorio en dominio. Sin Express ni Mongoose.
2. Schema Mongoose con `deletedAt: { type: Date, default: null }`. Sin campo `index`. Soft delete; lecturas `{ deletedAt: null }`.
3. Repositorio: encapsula Mongoose; si necesita otra entidad, inyecta **su repositorio**, no su modelo. Nada de caché en memoria. Normalizar `.lean()` si hay forma legacy.
4. Servicio de dominio + casos de uso. PUT/PATCH: el `id` entra por URL; el schema Zod **no** exige `id`; el controller junta `req.params.id` y `req.body`.
5. Controller: métodos flecha, `try/catch`, `AppError`, `next(e)`, `console.error` antes de propagar.
6. Zod en `src/infrastructure/http/schemas/`. `ruleset` como en el resto del catálogo (un sistema; herencia vía `getBySystems` / ancestros).
7. Routes: `@openapi` en español (resúmenes, descripciones, tags). `DELETE /recurso/:id` y, si aplica, `PATCH /recurso/:id/restore`.
8. Instanciar y exportar en `dependencies.ts`. Registrar el router donde se montan el resto.
9. Un test Vitest (`.test.ts` / `.spec.ts`) por caso de uso nuevo, junto al archivo.
10. `pnpm docs:openapi`. Luego `pnpm test` y `pnpm run build`. Si el build falla, falta un test en el código tocado.

Si el cambio cruza entidades (cascada, stats), el orquestador va en `application/`, no en un repositorio.

Entidad de catálogo nueva en el producto: nota en la wiki con `99 Plantillas/Plantilla entidad.md` (`wiki/DungeonsAndDragons/AGENTS.md`). No documentar cada commit.

Lógica entre entidades y trampas (`ruleset`, `index`, repos) mandan sobre esta skill si hay conflicto: `AGENTS.md`.
