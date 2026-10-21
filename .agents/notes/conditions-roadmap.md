# Hoja de ruta de estados (conditions)

## Estado actual

El catálogo describe estados simples (Cegado, Asustado) y escalonados (Cansancio):

- `description`: reglas generales (causas, acumulación, recuperación).
- `cumulative`: si es `true`, los niveles 1..N se aplican juntos.
- `levels`: `{ level, description }[]` con el texto de cada consecuencia.
- `recovery`: `{ restKey, delta }[]` validado contra `restRules.kinds` del ruleset.

Los personajes persisten `activeConditions: { conditionId, level? }[]`. Endpoints:

- `POST /character/:id/conditions` aplica (suma niveles; rechaza inmunidades).
- `PATCH /character/:id/conditions/:conditionId` con `delta`.
- `DELETE /character/:id/conditions/:conditionId`.

`POST /character/:id/rest` aplica `recovery` si el descanso cubre `restKey` (incluido por `includes`). Si el nivel baja de 1, se quita el estado.

No hay seed de Cansancio.

## Opción 3 — efectos mecánicos tipados (futuro)

Añadir efectos ejecutables al catálogo, no solo texto:

- Discriminated union por `type`: `disadvantage`, `speedMultiplier`, `maxHpMultiplier`, `death`, y hueco para 2024 (`d20Penalty`, `speedPenalty`).
- Efectos en la raíz del estado (Cegado, Agarrado) o en cada `ConditionLevel` (Cansancio).
- Resolver efectos activos: si `cumulative`, unir niveles `1..N`.
- Aplicación en lectura:
  - `speed` **después** de `applyTraitSpeed` en `formatCharacter`.
  - `HPMax` **derivado**; nunca persistir el valor reducido.
  - `disadvantage` / `death` se exponen como informativos hasta que existan tiradas en backend.

Fuera de esta opción: no mutar `HPMax` persistido; no implementar motor de tiradas solo para estos flags.

## Fuera de alcance hasta que se abra la opción 3

- Aplicar efectos de estados a `speed` / `HPMax` derivados.
- Seed de Cansancio en base de datos.
- Cambiar `HPActual` en `PersonajeApi` como campo persistido distinto del recorte en lectura.
