# Plan de upgrade TypeScript 5.9 → 6 → 7

Documento de trabajo. Las fases 0, 1 y 2 están hechas. El `package.json` está en `typescript` ^7.0.2. Queda la fase 3 (cierre / verificación).

Trabajo en **esta rama**. Fuera de este upgrade: ESM, Node 24/26 (`docs/nodejs-upgrade.md`), y saltar de 5.9 a 7 de un golpe.

## Contexto actual (oct 2026)

| Pieza | Valor |
| --- | --- |
| Compilador instalado | `typescript` ^7.0.2 (`tsc` nativo + `tsx` en desarrollo) |
| Destino siguiente | — (ESM / `nodenext` aparcado; Node 24/26 aparte) |
| `tsconfig.json` | `target: ES2021`, `module: CommonJS`, `moduleResolution: bundler`, `types: ["node"]`, `strict: true`, `rootDir: ./src` |
| `moduleResolution` | `bundler` (explícito; el implícito `node10` ya no aplica) |
| `types` | `["node"]` |
| Runtime | Node.js >= 22.12 (`engines` y README). `@types/node` ^22 ya está |
| Tests | Vitest 5; `**/*.test.ts` está en `exclude` de `tsc`; no hay `vitest.config` |
| Herramientas TS | No hay compiler API, `ts-node` ni transformers; solo `tsc` y `tsx` |

Otras opciones ya presentes: `esModuleInterop`, `skipLibCheck`, `resolveJsonModule`, `sourceMap`, `forceConsistentCasingInFileNames`, `outDir: ./dist`.

---

## Fase 0 — Inventario (hecho)

Objetivo: saber qué avisa o rompe TS 6 **antes** de cambiar la versión. Entregable: esta sección.

### `tsconfig` frente a TS 6

| Opción | Hoy | En 6.0 | Acción |
| --- | --- | --- | --- |
| `strict` | `true` | default `true` | Nada |
| `rootDir` | `./src` | default pasa a `.` (directorio del tsconfig) | Dejar explícito |
| `module` | `CommonJS` | default pasa a `esnext` | Dejar explícito |
| `target` | `ES2021` | default flotante (`es2025` hoy) | **No subir**; el runtime sigue en Node 22 |
| `types` | implícito (todo `@types`) | default `[]` | `"types": ["node"]` |
| `moduleResolution` | implícito `node10` | `node10` deprecado; con `module: commonjs` el camino soportado es `bundler` | `"moduleResolution": "bundler"` |
| `esModuleInterop` | `true` | `false` deprecado; interop siempre on | Dejar `true` o quitar (redundante) |
| `skipLibCheck` | `true` | sigue válido | Dejar |
| `ignoreDeprecations` | no está | parche temporal; **TS 7 lo rechaza** | **No usarlo**: `bundler` + `types` cubren las deprecaciones de este repo |

`resolveJsonModule` está activo; **cero** `import` de `.json` (OpenAPI se lee con `fs` + `JSON.parse`).

### Imports y módulos

- ~2399 imports relativos **sin extensión** (0 con `.js` / `.ts`).
- `__dirname` en `src/infrastructure/http/config/loadOpenApiSpec.ts`.
- Dos `require()` relativos sin extensión (`disciplina.repository.ts`, `metamagia.repository.ts`).
- No hay `"type": "module"` ni mapa `exports`/`imports` en `package.json`.

`moduleResolution: nodenext` o ESM exigiría extensiones `.js` y rompería `__dirname`. **No entra en este upgrade.**

**Decisión:** quedarse en CommonJS y declarar:

```json
"module": "CommonJS",
"moduleResolution": "bundler"
```

Camino oficial de TS 6 para quien emitía CJS con `node10` ([Allow `--module commonjs --moduleResolution bundler`](https://github.com/microsoft/TypeScript/pull/62320)). No exige `.js` en imports y quita la deprecación de `node10`. ESM (`"type": "module"` + `nodenext`) queda para más adelante.

### Tipos de Node

TS 6 deja de incluir todo `node_modules/@types`. Archivos que usan APIs de Node (`process`, `fs`, `path`, `Buffer`, `crypto`, `os`, `__dirname`):

- `src/app.ts`
- `src/infrastructure/config/config.ts`
- `src/infrastructure/dependencies.ts`
- `src/infrastructure/http/server.ts`
- `src/infrastructure/http/config/loadOpenApiSpec.ts`
- `src/infrastructure/http/config/swagger.ts`
- `src/infrastructure/http/config/loadOpenApiSpec.test.ts`
- `src/infrastructure/pdf/CharacterSheetPdfGenerator.ts`
- `src/infrastructure/http/controllers/personaje.controller.ts`
- `src/domain/services/auth.service.ts`
- `src/utils/generate_hash.ts`

No hay `NodeJS.*` ni `IncomingMessage` en app. Tests importan `vitest` (no hace falta `@types/jest`). Si Vitest se queja de tipos de Node en un `.test.ts`, alinear `types`; no typecheckear tests si `pnpm test` ya pasa.

### Herramientas y scripts

- `pnpm build` = `tsc`; `pnpm start` = `node dist/app.js`; `pnpm dev` = `tsx watch src/app.ts`.
- `docs:openapi` usa `tsx` sobre `src/`.
- Scripts `migrate:*` apuntan a `scripts/`, que **no está en disco**. Fuera de este upgrade.
- ~100 `as any`; 0 `@ts-ignore` / `@ts-expect-error`. No es riesgo de compiler API.
- `pnpm-workspace.yaml` solo tiene `allowBuilds`; no es un monorepo.

---

## Fase 1 — TypeScript 6.0.x (hecho)

`pnpm run build` (tsc 6.0.3) y `pnpm test` (142 archivos, 1287 tests) verdes. `pnpm docs:openapi` con `tsx` también. Sin `ignoreDeprecations`.

Objetivo: `pnpm run build` y `pnpm test` verdes con `typescript@6`, **sin** `ignoreDeprecations`.

1. `pnpm add -D typescript@6` (hoy 6.0.3).
2. En `tsconfig.json`:
   - `"types": ["node"]`
   - `"moduleResolution": "bundler"`
   - dejar explícitos `module: CommonJS`, `target: ES2021`, `rootDir: ./src`, `strict: true`
   - no tocar `skipLibCheck`
   - no subir `target`
3. `pnpm run build` y `pnpm test`. Corregir solo errores de tipos nuevos (defaults 6.0, inferencia, `noUncheckedSideEffectImports`).
4. Comprobar `pnpm docs:openapi` (`tsx`).
5. Append en `COMMIT_MESSAGE.md`. Sin commit ni push.

No entra: ESM, `nodenext`, extensiones `.js`, Node 24/26.

---

## Fase 2 — TypeScript 7.0.x (hecho)

`tsc --version` = 7.0.2. `pnpm run build` y `pnpm test` (142 archivos, 1287 tests) verdes. `pnpm docs:openapi` con `tsx` también. Sin `@typescript/typescript6` (este repo no usa el compiler API).

El editor puede seguir en el language service 6.x: activar la extensión de TypeScript 7 del workspace para que coincida con `tsc`. `pnpm start` sigue siendo `node dist/app.js`. No se instaló `@typescript/typescript6`. No se cambió `engines` ni el README de Node.

---

## Fase 3 — Verificación

1. `pnpm test`, `pnpm run build`, `pnpm dev`.
2. Actualizar README / `engines` solo si el runtime mínimo de Node cambia (no debería).
3. Regenerar `openapi.json` solo si `tsx` / swagger fallan.
4. Dejar este documento como hecho (versiones instaladas y `tsconfig` final). ESM sigue aparcado.

---

## Resumen de pasos

| Paso | Qué entra | Qué no entra |
| --- | --- | --- |
| 0 | Inventario (hecho) | Cambio de `typescript` |
| 1 | `typescript@6.0.3` + `"types": ["node"]` + `"moduleResolution": "bundler"` (hecho) | `nodenext`, ESM, `ignoreDeprecations` |
| 2 | `typescript@7.0.2` + chequeo IDE (hecho) | Compiler API 6, Node 24/26 |
| 3 | Verificación y cierre del doc | Subir `target`, ESM |

## Referencias

- [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
- [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [Allow `--module commonjs --moduleResolution bundler`](https://github.com/microsoft/TypeScript/pull/62320)
- `tsconfig.json` y `package.json` (fuente de verdad de lo instalado)
- `docs/nodejs-upgrade.md` (upgrade de runtime aparte)
