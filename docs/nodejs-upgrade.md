# Plan de upgrade Node.js 22 → 24 → 26

Documento de trabajo para subir el **runtime** más adelante. No cambia `engines`, README ni `AGENTS.md` hasta que se ejecute una fase a propósito.

Hoy (16 oct 2026) el aviso `Unsupported engine` es otra cosa: el proyecto pide `>=22.12.0` y la máquina está en **22.8.0**. Eso se arregla con un parche de la línea 22, sin tocar el repo.

Fuera de este upgrade: TypeScript 6/7 (`docs/typescript-upgrade.md`), pasar de CommonJS a ESM, o mezclar el bump de Node con un refactor de dominio.

## Ahora — parche 22.8 → 22.23 (local)

Node está en `C:\Program Files\nodejs\node.exe` (instalador oficial). No hay `nvm` ni `fnm`.

En PowerShell **como administrador**:

```powershell
winget install --id OpenJS.NodeJS.22 -e --accept-package-agreements --accept-source-agreements
```

Cierra todas las terminales (y Cursor si el PATH no se refresca), abre una nueva y comprueba:

```powershell
node -v
# esperado: v22.23.2 (winget) o v22.23.3 (MSI de nodejs.org)
```

Luego, en la raíz del repo, recompila addons nativos (`bcrypt`):

```powershell
pnpm install
pnpm test
pnpm run build
```

Si winget se queda en 22.23.2 y quieres el último parche: [https://nodejs.org/dist/v22.23.3/node-v22.23.3-x64.msi](https://nodejs.org/dist/v22.23.3/node-v22.23.3-x64.msi). Ambas cumplen `>=22.12.0`.

`winget list` puede mostrar un resto `OpenJS.NodeJS.18`; no es el `node` que usa el PATH. Se puede desinstalar cuando apetezca, no forma parte de este plan.

Para los majors 24/26 conviene un version manager (`fnm` o `nvm-windows`): el MSI de Program Files **sobrescribe** la única instalación. Hasta entonces, `winget` tiene IDs por línea:

| Línea | Paquete winget | Última en catálogo (oct 2026) |
| --- | --- | --- |
| 22 | `OpenJS.NodeJS.22` | 22.23.2 |
| 24 LTS | `OpenJS.NodeJS.LTS` / `OpenJS.NodeJS.24` | 24.20.0 (nodejs.org: 24.22.0) |
| 26 Current | `OpenJS.NodeJS` | 26.8.1 (nodejs.org: 26.12.0) |

El catálogo de winget va unos parches por detrás de [nodejs.org](https://nodejs.org/en/download). Para un major, preferir el MSI oficial de la línea concreta, no el alias `OpenJS.NodeJS` (Current) ni `OpenJS.NodeJS.LTS` (cambia de 24 a 26 el 28 oct).

---

## Contexto actual del repo

| Pieza | Valor |
| --- | --- |
| Runtime declarado | `engines.node`: `>=22.12.0` (README y `AGENTS.md` igual) |
| Runtime local | 22.8.0 → subir a 22.23.x (fase de arriba) |
| Compilado | `tsc` → CommonJS / `target: ES2021`; `pnpm start` = `node dist/app.js` |
| Dev | `tsx watch src/app.ts` |
| Tipos de Node | `@types/node` ^22 |
| Addon nativo | `bcrypt` ^6 (hay que reconstruir en cada major) |
| HTTP | Express 5, `trust proxy: 1`, rate limit por `req.ip` |
| Auth | `jsonwebtoken` + `bcrypt`; `crypto.randomBytes` para refresh |
| `fetch` | 2 usos (`defaultApi`, PDF de ficha); no hay `url.parse` ni `writeHeader` |
| CI / Docker | no hay; `vercel.json` no fija versión de Node |

---

## Calendario (octubre 2026)

| Línea | Estado el 16 oct | Cambio próximo | EOL |
| --- | --- | --- | --- |
| 22 Jod | Maintenance LTS | — | 30 abr 2027 |
| 24 Krypton | Active LTS | Maintenance el **20 oct 2026** | 30 abr 2028 |
| 26 | Current | Active LTS el **28 oct 2026** | 30 abr 2029 |

26 es la última línea del modelo even/odd. A partir de 27 hay un major al año (abril) y todos pasan a LTS.

---

## ¿Saltar a 26 de golpe?

**No hoy.** 26 sigue en Current hasta el 28 oct. El `engines` del repo solo debe apuntar a LTS.

**Sí tiene sentido 22 → 26 en un PR de repo**, *después* del 28 oct, con dos checkpoints locales. Motivos en este código:

1. El 20 oct, 24 deja de ser Active LTS. Aterrizar `engines` en 24 es aterrizar en Maintenance a los cuatro días.
2. El inventario de APIs rotas en `src/` está limpio: no hay `url.parse`, `writeHeader`, `createCipher`/`createDecipher`, `_stream_*` ni `--experimental-transform-types`.
3. El riesgo real es de ecosistema, no de app: **rebuild de `bcrypt`**, avisos de `tsx` (`module.register()` deprecado en runtime en 26), y alinear `@types/node`.
4. No hay matriz de CI ni imágenes Docker que duplicar.

El camino 22 → 24 → 26 (dos PRs de `engines`) sigue siendo más fácil de diagnosticar si algo falla. Usarlo si 24 o 26 rompen tests o el addon.

**Por defecto al ejecutar el plan:** verificar en local 24 y luego 26; si 26 ya es LTS y los dos checkpoints pasan, un solo PR con `engines` → `>=26`. Si 26 aún no es LTS, parar el PR en 24 (`>=24`) y repetir la fase 26 después del 28 oct.

No mezclar ese PR con TypeScript 6/7 ni con ESM.

---

## Fase 1 — Inventario (sin cambiar `engines`)

Objetivo: saber qué puede romper **antes** de instalar 24 o 26.

1. Confirmar el parche 22.23.x y que `pnpm test` / `pnpm run build` están verdes.
2. Listar addons nativos: hoy solo `bcrypt`. Tras cada major: `pnpm install` (o borrar `node_modules` y reinstalar).
3. Buscar en `src/` y scripts: `url.parse`, `writeHeader`, `createCipher`, `SlowBuffer`, `process.assert`, `fs.F_OK`, `dirent.path`, `_stream_`, `--experimental-transform-types`. Hoy no hay matches.
4. Revisar los dos `fetch` (API D&D externa y PDF). En 24 el `fetch` es más estricto; en 26 va Undici 8 (HTTP/2). Probar esas rutas a mano.
5. Anotar `tsx`: en 26 `module.register()` pasa a deprecación de runtime. Si `pnpm dev` llena de warnings, subir `tsx` en el mismo PR de Node, no en uno de dominio.
6. Decidir version manager vs MSI. Recomendado: `fnm` para tener 22, 24 y 26 a la vez.

Entregable: go / no-go para 26 directo, y lista de paquetes a reconstruir.

---

## Fase 2 — Checkpoint Node 24 (local; `engines` opcional)

Objetivo: aislar roturas de 23+24 (V8 13.6, OpenSSL 3.5, npm 11, type stripping estable).

1. Instalar 24.22.x (MSI o `winget install --id OpenJS.NodeJS.LTS -e` **solo mientras** LTS sea 24; a partir del 28 oct ese ID apunta a 26).
2. `pnpm install` (rebuild `bcrypt`).
3. `pnpm test` y `pnpm run build`.
4. `pnpm dev`: login, refresh token, un GET con `trust proxy`, generación de PDF si hay imagen remota.
5. Arrancar con deprecaciones visibles:

   ```powershell
   $env:NODE_PENDING_DEPRECATION="1"
   pnpm dev
   ```

6. Si este checkpoint es el destino del repo (26 aún Current): actualizar `engines` a `>=24`, `@types/node` a ^24, README y `AGENTS.md`. Si 26 ya es LTS, **no** hacer PR: seguir a la fase 3.

Roturas típicas 22 → 24 (oficial: [v22 to v24](https://nodejs.org/en/blog/migrations/v22-to-v24)):

- OpenSSL 3.5 nivel 2: RSA/DSA/DH &lt; 2048 bits y RC4 prohibidos. JWT HMAC-SHA256 y `crypto.randomBytes` no deberían verse afectados.
- Addons C++ ligados a V8 13.6 → rebuild.
- `fetch` / AbortSignal más estrictos.
- Sin binarios Win32 x86 (irrelevante si desarrollas en x64).

Codemods oficiales, por si el inventario encuentra usos: `@nodejs/crypto-rsa-pss-update`, `@nodejs/dirent-path-to-parent-path`, `@nodejs/fs-access-mode-constants`, `@nodejs/process-assert-to-node-assert`.

---

## Fase 3 — Node 26 (después del 28 oct 2026, cuando sea LTS)

Objetivo: runtime de producción en 26.x (EOL abr 2029).

1. Instalar 26.12.x (MSI de la línea 26, no el alias Current a ciegas).
2. `pnpm install` otra vez (`NODE_MODULE_VERSION` 147: `bcrypt` compilado en 24 no carga en 26).
3. `pnpm test`, `pnpm run build`, `pnpm dev` y el mismo smoke de auth + PDF.
4. Quitar `--experimental-transform-types` si apareciera en algún script (en 26 esa flag ya no existe). Este repo no la usa.
5. Actualizar en el **mismo** PR (si se salta 24) o en uno nuevo:
   - `package.json` → `"engines": { "node": ">=26.0.0" }` (o el parche LTS concreto).
   - `@types/node` a ^26.
   - README, `AGENTS.md`.
   - `.nvmrc` / `.node-version` si se adoptó version manager.
6. No subir `tsconfig` `target` ni pasar a ESM en este PR.

Roturas típicas 24 → 26 (notas de [v26.0.0](https://nodejs.org/en/blog/release/v26.0.0); no hay guía oficial v24-to-v26 a fecha de este doc):

- Eliminado `http.Server.prototype.writeHeader()` → usar `writeHead()`.
- Eliminados los módulos legacy `_stream_*`.
- `crypto.createCipher` / `createDecipher` en EOL (DEP0182).
- `module.register()` deprecado en runtime → vigilar `tsx`.
- Temporal API activa por defecto (no se usa en este repo).
- Undici 8: `fetch` puede hablar HTTP/2.

---

## Fase 4 — Verificación

1. `pnpm test`, `pnpm run build`, `pnpm dev`.
2. `pnpm audit` (el runtime nuevo no sustituye overrides de pnpm).
3. Login / refresh con rate limit: `req.ip` sigue dependiendo de `trust proxy`.
4. Append en `COMMIT_MESSAGE.md` (no sobrescribir) y dejar el diff acotado al runtime.

---

## Resumen de PRs sugeridos

| PR | Qué entra | Qué no entra |
| --- | --- | --- |
| 0 | Nada en git. Parche local a 22.23.x | `engines`, dependencias |
| 1 | Inventario / esta fase 1 | Cambio de Node en el repo |
| 2a | Si 26 aún no es LTS: `engines` ≥24, `@types/node` ^24, docs | TS 6/7, ESM, dominio |
| 2b | Si 26 ya es LTS y 24+26 verdes en local: `engines` ≥26, `@types/node` ^26, docs | Parada intermedia en 24 en git |
| 3 | Solo si 2a existió: bump 24 → 26 | Refactors de dominio |

## Referencias

- [Calendario de releases](https://github.com/nodejs/Release)
- [Migración v22 → v24](https://nodejs.org/en/blog/migrations/v22-to-v24)
- [Node.js 24.0.0](https://nodejs.org/en/blog/release/v24.0.0)
- [Node.js 26.0.0](https://nodejs.org/en/blog/release/v26.0.0)
- [Cambio de calendario a partir de 27](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule)
- `package.json`, `README.md` y `AGENTS.md` (fuente de verdad de `engines`)
- `docs/typescript-upgrade.md` (upgrade aparte del compilador)
