# Plan de upgrade TypeScript 5.9 → 6 → 7

Documento de trabajo para subir el compilador **más adelante**. No instala TypeScript 6 ni 7: el `package.json` se queda en `typescript` ^5.9.3 hasta que se ejecute este plan a propósito.

Fuera de este upgrade: cambios de dominio, migraciones de datos, o mezclar el bump del compilador con un cambio de CommonJS a ESM en el mismo PR.

## Contexto actual

| Pieza | Valor |
| --- | --- |
| Compilador | `typescript` ^5.9.3 (`tsc` + `tsx` en desarrollo) |
| `tsconfig.json` | `target: ES2021`, `module: CommonJS`, `strict: true` |
| `moduleResolution` | **no declarado** → con `module: CommonJS` equivale a `node10` (deprecado en TS 6) |
| Runtime | Node.js >= 22.12 (`engines` y README) |
| Tests | Vitest 5; `**/*.test.ts` está en `exclude` de `tsc` |
| Herramientas TS | No hay API de compilador propia; solo `tsc` y `tsx` |

Otras opciones relevantes: `esModuleInterop`, `skipLibCheck`, `resolveJsonModule`, `sourceMap`, `forceConsistentCasingInFileNames`, `rootDir: ./src`, `outDir: ./dist`.

---

## Fase 1 — Inventario (sin subir el compilador)

Objetivo: saber qué va a avisar o romper TS 6 **antes** de cambiar la versión.

1. Comparar `tsconfig.json` con las deprecaciones de TypeScript 6, en especial:
   - `moduleResolution` implícito `node10`.
   - Cualquier opción marcada como deprecated en 6.0 (revisar release notes oficiales al ejecutar esta fase).
2. Listar imports relativos en `src/` (hoy sin extensión `.js`). Un salto a `node16` / `nodenext` puede exigir esas extensiones o forzar ESM.
3. Comprobar usos de tipos de Node (`process`, `Buffer`, `fs`, etc.). En TS 6 el default de `types` pasa a vacío: hará falta `"types": ["node"]` (y, si Vitest lo necesita en archivos de test, alinear el `tsconfig` de tests).
4. **No** dejar `ignoreDeprecations: "6.0"` como estado final: TypeScript 7 elimina esa bandera.

Entregable: lista corta de cambios de `tsconfig` y riesgos de módulos. Sin bump de `typescript`.

---

## Fase 2 — TypeScript 6.0.x

Objetivo: que el repo compile y testee con TS 6, **sin** migrar a la vez la resolución de módulos.

1. `pnpm add -D typescript@6`
2. Ajustar defaults nuevos si pisan el proyecto:
   - `"types": ["node"]` para tipos de Node en `src/`.
   - Revisar otros defaults de 6.0 en las notas de la versión instalada.
3. `pnpm run build` y `pnpm test`.
4. Si `node10` dispara deprecaciones: se puede usar `ignoreDeprecations: "6.0"` **solo de forma temporal** en este PR.

**No mezclar** en este PR el cambio `moduleResolution` → `node16` / `nodenext`. Eso puede exigir extensiones `.js` en imports o empujar a `"type": "module"`. Primero hacer compilar con 6; la migración de módulos va en un PR aparte.

---

## Fase 3 — Dejar el tsconfig listo para TS 7

Objetivo: quitar parches temporales y decidir el sistema de módulos **antes** del compilador nativo.

1. Quitar `ignoreDeprecations` (TS 7 ya no lo acepta).
2. En un PR **aparte** de la fase 2, elegir una de estas líneas y aplicarla:
   - Seguir en CommonJS con una `moduleResolution` soportada en 6/7 (documentar la opción concreta al ejecutarlo).
   - Pasar a ESM (`"type": "module"`, `module`/`moduleResolution` nodenext) y adaptar imports, `tsx` y el arranque (`dist/app.js`).
3. Opcional, solo para comparar 6 vs 7: `stableTypeOrdering`. Puede ralentizar hasta ~25%; no dejarlo permanente.
4. Confirmar que `skipLibCheck` sigue siendo aceptable (dependencias con tipos flojos).

Entregable: `tsconfig` sin flags de deprecación y decisión explícita CJS vs ESM.

---

## Fase 4 — TypeScript 7.0.x (compilador nativo)

Objetivo: `typescript@7` (implementación en Go). El comportamiento de tipos debe alinearse con TS 6 si la fase 3 está limpia.

1. `pnpm add -D typescript@7`
2. `pnpm run build` y `pnpm test`. Esperar compilaciones más rápidas.
3. El API de TypeScript 6 para herramientas raras **puede no aplicar**. En este repo solo se usa `tsc` + `tsx`; no hay wrappers del compiler API.
4. Verificar el IDE: Cursor/VS Code debe usar el TypeScript del workspace. Si el editor no sigue a TS 7, instalar/activar la extensión de TypeScript 7.

No mezclar este bump con refactors de dominio.

---

## Fase 5 — Verificación

1. `pnpm test`, `pnpm run build`, `pnpm dev`.
2. Actualizar README / `engines` solo si el runtime mínimo de Node cambia por el compilador o por ESM.
3. Regenerar o revisar scripts (`docs:openapi`, migraciones `tsx`) si el módulo system cambió.
4. Append en `COMMIT_MESSAGE.md` (no sobrescribir) y dejar el diff acotado al upgrade.

---

## Resumen de PRs sugeridos

| PR | Qué entra | Qué no entra |
| --- | --- | --- |
| 1 | Inventario / notas (esta fase 1) | Cambio de `typescript` |
| 2 | `typescript@6` + `types: ["node"]` y defaults | `moduleResolution` node16/nodenext, ESM |
| 3 | Quitar `ignoreDeprecations`; CJS estable o migración ESM | Bump a TS 7 |
| 4 | `typescript@7` + chequeo IDE | Refactors de dominio |

## Referencias

- [TypeScript 6 iteration plan](https://github.com/microsoft/TypeScript/issues/62686)
- [TypeScript 7 (native) announcement](https://devblogs.microsoft.com/typescript/typescript-native-port/)
- `tsconfig.json` y `package.json` de este repositorio (fuente de verdad de versiones instaladas).
