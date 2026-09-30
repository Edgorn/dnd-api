# Hoja de ruta de estados (conditions)

Este documento deja constancia del análisis de las opciones 3 y 4. **No están implementadas.** La iteración actual solo cubre el catálogo (`levels` + `cumulative` en `Condition`).

## Estado actual (opción 2)

El catálogo puede describir estados simples (Cegado, Asustado) y estados escalonados (Cansancio):

- `description`: reglas generales (causas, acumulación, recuperación).
- `cumulative`: si es `true`, los niveles 1..N se aplican juntos.
- `levels`: `{ level, description }[]` con el texto de cada consecuencia.

Los personajes **no** guardan estados activos. No hay seed de Cansancio ni endpoints anidados.

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

## Opción 4 — estados activos en el personaje (futuro)

Runtime en `Personaje`, no en criaturas (las criaturas siguen siendo catálogo):

- Persistencia: `activeConditions: { conditionId, level? }[]`.
- Endpoints bajo `/character/:id/conditions` (POST aplicar / PATCH `delta` / DELETE), siguiendo el patrón de equipamiento/dinero.
- Inmunidades ya agregadas desde rasgos (`condition_inmunities`) para rechazar el alta.
- Cansancio: al reaplicar, sumar niveles; bajar de 1 elimina el estado.
- No hay descanso largo hoy: no inventar un long rest completo; `PATCH` con `delta: -1` basta. Un campo `recovery` en el catálogo puede esperar.
- `HPActual` se recorta si supera el `HPMax` derivado; no mutar el `HPMax` persistido.

Dependencia: la opción 3 debe existir (o al menos el contrato de efectos) para que GET personaje derive `speed` y `HPMax`.

## Fuera de alcance hasta que se abra cada opción

- Aplicar o guardar condiciones en personajes o criaturas.
- Seed de Cansancio en base de datos.
- Endpoint de descanso largo.
- Cambiar `HPActual` en `PersonajeApi` como campo persistido distinto del recorte en lectura.
