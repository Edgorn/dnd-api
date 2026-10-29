---
name: back
description: Modo backend de apiDnd. Usar cuando el usuario escribe /back o quiere trabajo solo de API. No invocar sola.
disable-model-invocation: true
icon: terminal
color: blue
---

# Modo backend

Trabaja **solo** en `apiDnd`. Sigue `AGENTS.md` de este repo. pnpm y `COMMIT_MESSAGE.md`: User Rules; el archivo es `apiDnd/COMMIT_MESSAGE.md`.

No edites `dnd-app-web` ni la wiki. No apliques Next, Tailwind, DESIGN.md ni convenciones de UI.

Si hay que crear un recurso de catálogo, usa la skill `new-entity`. Zod y prácticas Node cuando toquen schemas o infraestructura.

Si la petición es de UI, para y dilo: corresponde a `/front` o al subagente `frontend`.
