# Auditorías de Código — `dnd-api`

## 📋 Resumen General de Auditorías

| Módulo Auditado | Fecha | Archivos Principales | Estado |
|---|---|---|---|
| **Autenticación y Usuarios** | 2026-07-12 | `user.routes.ts`, `user.controller.ts`, `user.service.ts` | ✅ Corregido (2026-07-20) |
| **Características / Atributos** | 2026-07-12 | `attribute.routes.ts`, `attribute.controller.ts`, `attribute.service.ts` | ✅ Corregido (2026-07-20) |
| **Habilidades (`skill`)** | 2026-07-13 | `skill.routes.ts`, `skill.controller.ts`, `skill.service.ts` | ✅ Corregido (2026-07-20) |
| **Sistemas (`system`)** | 2026-07-13 | `system.routes.ts`, `system.controller.ts`, `system.service.ts` | ✅ Corregido (2026-07-20) |
| **Rasgos (`trait`)** | 2026-07-13 | `trait.routes.ts`, `trait.controller.ts`, `trait.service.ts` | ✅ Corregido (2026-07-20) |

---

## Módulo de Autenticación y Usuarios (`user.routes.ts` y derivados) — 2026-07-12

**Archivos auditados:**
- [`src/infrastructure/http/routes/user.routes.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/routes/user.routes.ts)
- [`src/infrastructure/http/controllers/user.controller.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/controllers/user.controller.ts)
- [`src/application/use-cases/user/`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/application/use-cases/user/) _(login, refreshToken, logout, validateToken, validarToken)_
- [`src/domain/services/user.service.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/services/user.service.ts)
- [`src/domain/repositories/IUserRepository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/repositories/IUserRepository.ts)
- [`src/domain/ports/IPasswordHasher.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/ports/IPasswordHasher.ts) / [`ITokenService.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/ports/ITokenService.ts) / [`IUserCache.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/ports/IUserCache.ts) / [`IRefreshTokenRepository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/ports/IRefreshTokenRepository.ts)
- [`src/infrastructure/databases/mongoDb/repositories/user.repository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/databases/mongoDb/repositories/user.repository.ts)
- [`src/infrastructure/databases/mongoDb/repositories/refreshToken.repository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/databases/mongoDb/repositories/refreshToken.repository.ts)
- [`src/infrastructure/security/BcryptPasswordHasher.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/security/BcryptPasswordHasher.ts)
- [`src/infrastructure/security/JwtTokenService.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/security/JwtTokenService.ts)
- [`src/infrastructure/cache/InMemoryUserCache.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/cache/InMemoryUserCache.ts)
- [`src/infrastructure/http/middlewares/auth.middleware.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/middlewares/auth.middleware.ts)
- [`src/infrastructure/http/schemas/login.schema.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/schemas/login.schema.ts)

---

## ✅ Puntos Fuertes

### 1. Arquitectura Hexagonal correctamente aplicada
El módulo de autenticación es el mejor ejemplo de Arquitectura Hexagonal en el proyecto. Se distingue claramente:
- **Puertos** bien definidos en el dominio (`IPasswordHasher`, `ITokenService`, `IUserCache`, `IRefreshTokenRepository`).
- **Adaptadores** concretos en infraestructura (`BcryptPasswordHasher`, `JwtTokenService`, `InMemoryUserCache`, `RefreshTokenRepository`).
- El **dominio** (`UserService`) opera exclusivamente sobre abstracciones, sin acoplamiento a librerías externas.
- Los **casos de uso** son delgados y orquestan correctamente sin lógica de negocio propia.

### 2. Protección contra timing attacks en el login
En `user.service.ts` (línea 25), cuando el usuario no existe, se ejecuta de todas formas un `compare` contra un hash dummy:
```typescript
await this.passwordHasher.compare(password, DUMMY_PASSWORD_HASH);
```
Esta es una técnica de seguridad avanzada que previene **ataques de temporización** (timing attacks), donde un atacante podría deducir si un usuario existe midiendo el tiempo de respuesta. Es una práctica de seguridad excelente.

### 3. Estrategia de Refresh Token segura (Rotation)
En `refreshToken.use-case.ts` se implementa correctamente la técnica de **Refresh Token Rotation**:
1. Se verifica que el token exista, no esté revocado y no haya expirado.
2. Se revoca el token anterior con `revokeByToken`.
3. Se genera y almacena uno nuevo.

Esto previene el reuso de tokens robados y garantiza que cada rotación invalide el anterior.

### 4. Rate limiting en el endpoint de login
En `user.routes.ts` se aplica `express-rate-limit` únicamente al endpoint `POST /login` con una ventana de 15 minutos y máximo de 10 intentos. Es una medida esencial contra ataques de fuerza bruta bien colocada.

### 5. Separación de responsabilidades impecable en el controlador
`user.controller.ts` únicamente: extrae datos del request, llama al use case, y responde. No contiene lógica de negocio. El manejo de errores delega correctamente a `next(error)`, que es recogido por `errorHandler.middleware.ts`.

### 6. Inyección de dependencias vía constructor en toda la cadena
Toda la cadena (UserService → UseCase → Controller) usa inyección por constructor, facilitando la testabilidad y el cumplimiento con los principios SOLID.

### 7. `UserRepository` usa `.lean()` correctamente
En `user.repository.ts`, todas las consultas usan `.lean<T>()` de Mongoose. Esto devuelve POJOs planos en lugar de documentos Mongoose completos, mejorando significativamente el rendimiento.

### 8. `JwtTokenService` valida la presencia del secreto en construcción
En el constructor de `JwtTokenService` (línea 9) se lanza un error si `JWT_SECRET` no está configurado, evitando que la aplicación arranque en un estado inseguro.

### 9. Caché de validación de token con TTL
`InMemoryUserCache` implementa una caché con tiempo de expiración (TTL) por cada entrada, evitando que el servidor consulte MongoDB en cada petición autenticada. La invalidación automática al leer (`cache.delete` si expirado) es correcta.

### 10. Documentación Swagger completa
`user.routes.ts` tiene JSDoc con `@openapi` para los tres endpoints, con sus esquemas de entrada/salida y todos los códigos de respuesta documentados correctamente en español.

---

## ⚠️ Puntos Débiles y Problemas

### 1. 🔴 Dependencias opcionales con `?` en el constructor del controlador

```typescript
// user.controller.ts - líneas 10-11
private readonly refreshTokenUseCase?: RefreshTokenUseCase,
private readonly logoutUseCase?: LogoutUseCase
```

`RefreshTokenUseCase` y `LogoutUseCase` están marcados como opcionales, lo que provoca que el controlador tenga que validar su existencia en cada método:

```typescript
// logout - línea 55
if (refreshToken && this.logoutUseCase) {
  await this.logoutUseCase.execute(refreshToken);
}
```

Esto introduce un **código defensivo innecesario y silencioso**. Si `logoutUseCase` no está inyectado, el logout no hace nada (no revoca el token, no lanza error). Esto puede pasar desapercibido en producción. Ambos casos de uso deberían ser **obligatorios** (`readonly`, sin `?`).

---

### 2. 🔴 `DUMMY_PASSWORD_HASH` duplicado en dos archivos

El mismo hash dummy está definido en **dos lugares**:
- `user.service.ts` línea 9: `const DUMMY_PASSWORD_HASH = '$2b$10$...'`
- `BcryptPasswordHasher.ts` línea 5: `const DUMMY_HASH = '$2b$10$...'` (también expuesto con `static get dummyHash()`)

Hay una constante duplicada con valores copiados a mano. El riesgo es que si en algún momento cambian los salt rounds en `BcryptPasswordHasher` (actualmente 10), el hash dummy hardcodeado en `user.service.ts` dejaría de ser un hash bcrypt válido de `$2b$10$`, dejando potencialmente al descubierto los timing attacks que busca prevenir.

**Solución:** El `UserService` debería recibir el hash dummy como parámetro de construcción o llamar a `BcryptPasswordHasher.dummyHash`, no mantener su propia copia.

---

### 3. 🔴 `validarToken` en `user.service.ts` mezcla español e inglés en el mismo método

```typescript
// user.service.ts - línea 77
async validarToken(token: string): Promise<string | null> {
```

El método se llama `validarToken` (Spanglish) pero el use-case que lo llama se llama `validateToken.use-case.ts`. Hay también un archivo `validarToken.use-case.ts` que es solo un alias de re-exportación del otro, creando ruido innecesario. Según la regla 8 del AGENTS.md, el código nuevo debe estar en inglés.

---

### 4. 🟡 `refreshToken.use-case.ts` y `logout.use-case.ts` son capas vacías sin valor

Ambos use-cases son literalmente un proxy de una línea:

```typescript
// refreshToken.use-case.ts
execute(refreshToken: string): Promise<LoginResult | null> {
  return this.userService.refreshToken(refreshToken);
}
```

En principio, los use-cases existen para orquestar lógica entre múltiples repositorios o servicios. Cuando son solo wrappers de un único método de servicio, añaden capas sin añadir valor. Esto no viola ninguna regla del proyecto, pero es útil ser consciente de que si el servicio crece, se podría refactorizar.

---

### 5. 🟡 `auth.middleware.ts` no delega en el `errorHandler`

Cuando el token es inválido o hay un error interno, el middleware responde directamente con `res.status().json()` en lugar de llamar a `next(new AppError(...))`:

```typescript
// auth.middleware.ts - línea 11
return res.status(401).json({ error: "Token no proporcionado" });
// ...línea 25
return res.status(500).json({ error: "Error interno de autenticación" });
```

Esto rompe la consistencia en el manejo de errores del proyecto, que por convención (según AGENTS.md) debería pasar siempre por el middleware global `errorHandler`. Si en el futuro se quiere añadir logging centralizado o un formato de respuesta de error diferente, habrá que modificar este middleware además del global.

---

### 6. 🟡 `RefreshToken` no tiene limpieza de tokens expirados (cleanup)

`refreshToken.repository.ts` implementa `revokeAllByUser()` pero **no hay ningún proceso de limpieza** de tokens revocados o expirados en la base de datos. Con el tiempo, la colección `refreshtokens` de MongoDB crecerá indefinidamente con documentos expirados o revocados que ya no sirven.

**Solución recomendada:** Añadir un TTL index en MongoDB para el campo `expiresAt` del schema `RefreshToken`, lo que elimina los documentos automáticamente al expirar sin necesidad de código adicional:
```javascript
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

### 7. 🟡 `findByToken` en `RefreshTokenRepository` filtra `revoked: false` en la query pero `UserService` también chequea `storedToken.revoked`

```typescript
// refreshToken.repository.ts - línea 15
const doc = await RefreshTokenModel.findOne({ token, revoked: false }).lean<...>();

// user.service.ts - línea 49
if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
```

El check `storedToken.revoked` en el servicio es **código muerto** porque el repositorio ya filtra por `revoked: false`. Si el repositorio devuelve un objeto, `revoked` siempre será `false`. Esta doble validación añade confusión sobre dónde reside la fuente de verdad.

---

### 8. 🟡 `InMemoryUserCache` es un problema de escalabilidad para producción

La caché en memoria (`InMemoryUserCache`) es útil en desarrollo, pero en un despliegue con **múltiples instancias** (que es el caso con Vercel), cada instancia tiene su propia caché independiente. Esto significa que:
- Un usuario eliminado en la base de datos podría seguir siendo considerado válido en algunas instancias durante los 5 minutos del TTL.
- La regla 10 del AGENTS.md prohíbe cachés en repositorios, pero la caché de usuario en el **servicio de dominio** es un caso borde.

El AGENTS.md documenta correctamente la prohibición de cachés en repositorios, pero no menciona este caso. Para escalar, se debería sustituir por una caché distribuida (Redis). Para el contexto actual (servidor único), es aceptable.

---

### 9. 🟢 `loginSchema` no valida longitud mínima real de contraseña

```typescript
// login.schema.ts
password: z.string().min(1, "La contraseña es requerida"),
```

La validación solo garantiza que la contraseña no esté vacía. No hay ninguna otra validación del formato. Esto es correcto para el **login** (ya que el hash lo valida bcrypt), pero debería documentarse explícitamente que `loginSchema` es solo para **autenticación**, no para el registro de nuevos usuarios (que requeriría requisitos de complejidad).

---

### 10. 🟢 `logout` devuelve 200 aunque `refreshToken` no se proporcione

```typescript
// user.controller.ts - línea 51-62
logout = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  if (refreshToken && this.logoutUseCase) {
    await this.logoutUseCase.execute(refreshToken);
  }
  res.status(200).json({ message: "Sesión cerrada correctamente" });
};
```

Si el cliente envía una petición a `/logout` sin `refreshToken`, el servidor responde `200 OK` sin haber revocado nada. Silenciosamente el logout no ocurre. Esto puede parecer intencional (logout "best-effort"), pero carece de documentación Swagger al respecto. Si el logout es obligatorio, debería lanzar un `AppError(400)`.

---

## 📊 Resumen

| Capa | Calidad | Comentario |
|---|---|---|
| `user.routes.ts` | ✅ Excelente | Rate limiting, Swagger completo, validación Zod |
| `user.controller.ts` | 🟡 Bueno | Dependencias opcionales innecesarias |
| Use-cases | 🟡 Correcto | Son capas finas, `validarToken` en Spanglish |
| `user.service.ts` | ✅ Muy bueno | Anti-timing, refresh rotation, caché correcta |
| `user.repository.ts` | ✅ Bueno | `.lean()`, mapper limpio |
| `refreshToken.repository.ts` | 🟡 Correcto | Sin TTL index en MongoDB, check redundante |
| `JwtTokenService.ts` | ✅ Excelente | Valida secreto, tipado correcto |
| `BcryptPasswordHasher.ts` | ✅ Bueno | Hash dummy duplicado en service |
| `InMemoryUserCache.ts` | 🟡 Aceptable | No escalable en multi-instancia |
| `auth.middleware.ts` | 🟡 Correcto | No delega en errorHandler global |

### Acciones Prioritarias

| Prioridad | Problema | Acción |
|---|---|---|
| 🔴 Alta | Dependencias opcionales en controlador | Hacer `refreshTokenUseCase` y `logoutUseCase` obligatorios |
| 🔴 Alta | `DUMMY_PASSWORD_HASH` duplicado | Eliminar la copia en `user.service.ts` y usar `BcryptPasswordHasher.dummyHash` |
| 🔴 Alta | `validarToken` en Spanglish | Renombrar a `validateToken` en `UserService` y eliminar `validarToken.use-case.ts` |
| 🟡 Media | Sin TTL index en RefreshToken | Añadir `expireAfterSeconds: 0` al schema de Mongoose |
| 🟡 Media | `auth.middleware.ts` no usa errorHandler | Refactorizar para llamar `next(new AppError(...))` |
| 🟡 Media | Check redundante de `revoked` en service | Eliminar la condición de `storedToken.revoked` del servicio |
| 🟢 Baja | Logout silencioso sin refreshToken | Decidir si debe ser `400 Bad Request` o documentar el comportamiento actual |

---

## Módulo de Características/Atributos (`attribute.routes.ts` y derivados) — 2026-07-12

**Archivos auditados:**
- [`src/infrastructure/http/routes/attribute.routes.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/routes/attribute.routes.ts)
- [`src/infrastructure/http/controllers/attribute.controller.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/controllers/attribute.controller.ts)
- [`src/infrastructure/http/schemas/attribute.schema.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/schemas/attribute.schema.ts)
- [`src/application/use-cases/attribute/`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/application/use-cases/attribute/) _(createAttribute, updateAttribute, softDeleteAttribute, restoreAttribute)_
- [`src/domain/services/attribute.service.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/services/attribute.service.ts)
- [`src/domain/repositories/IAttributeRepository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/repositories/IAttributeRepository.ts)
- [`src/domain/types/attribute.types.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/types/attribute.types.ts)
- [`src/infrastructure/databases/mongoDb/repositories/attribute.repository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/databases/mongoDb/repositories/attribute.repository.ts)

---

## ✅ Puntos Fuertes

### 1. Soft delete bien implementado con `deletedAt`
El borrado lógico está correctamente implementado: `softDelete` guarda `deletedAt: new Date()` y las queries en `getBySystems` filtran con `deletedAt: null`. Esto preserva la trazabilidad de los datos y permite la restauración. Además existe `softDeleteByRuleset` y `restoreByRuleset` para operaciones en cascada, lo que evidencia que la entidad está preparada para el ciclo de vida completo del sistema padre.

### 2. Autorización basada en propiedad del sistema en los Use-Cases Orquestadores
Los use-cases `SoftDeleteAttribute` y `RestoreAttribute` son excelentes ejemplos del patrón de **Caso de Uso Orquestador** dictado por la regla 12 del AGENTS.md. Coordinan dos servicios (`AttributeService` y `SystemService`) para verificar que el usuario que solicita la acción es el `publisher` del sistema al que pertenece el atributo, antes de proceder:

```typescript
const system = await this.systemService.obtenerPorId(attribute.ruleset);
if (system.publisher !== userId) {
  throw new AppError("No tienes permisos para borrar este atributo", 403);
}
```

Esto sigue el principio de que los repositorios no se acoplan entre sí.

### 3. Detección de unicidad con índice de MongoDB y `ConflictError`
En `create`, si MongoDB lanza un error `code 11000` (clave duplicada), el repositorio lo captura y lanza un `ConflictError` semántico del dominio en lugar de propagar un error crudo de Mongoose. Esto es una buena práctica de encapsulamiento.

### 4. Validaciones Zod correctas y coherentes
- `CreateAttributeSchema` exige todos los campos obligatorios según el contrato de dominio.
- `UpdateAttributeSchema` aplica `.refine()` para forzar que al menos un campo sea proporcionado, evitando peticiones `PUT` vacías que generarían operaciones inútiles en base de datos.
- Ambos esquemas se aplican en las rutas antes del controlador vía `validateSchema`, siguiendo el patrón correcto.

### 5. Método `update` usa `$set` con `findByIdAndUpdate`
En `attribute.repository.ts` (línea 36), el update usa `{ $set: updateFields }` con `returnDocument: 'after'`, lo que es correcto y eficiente: evita leer el documento antes de actualizarlo y devuelve directamente el documento actualizado.

### 6. Swagger documentado para todos los endpoints
Los cuatro endpoints (`POST`, `PUT`, `DELETE`, `PATCH`) tienen su documentación `@openapi` completa con esquemas de entrada, códigos de respuesta y seguridad (`bearerAuth`) correctamente declarados.

### 7. `formatAttribute` centraliza el mapeo de Mongoose a DTO
El método privado `formatAttribute` actúa como único punto de conversión del documento Mongoose al DTO de la API, evitando que la lógica de mapeo esté dispersa.

---

## ⚠️ Puntos Débiles y Problemas

### 1. 🔴 `IAttributeRepository` expone métodos de formateo de negocio (`formatAbilityBonuses`, `formatAbilityBonusChoices`)

```typescript
// IAttributeRepository.ts
formatAbilityBonuses(bonuses: AttributeBonusCreate[], system: string): Promise<AttributeBonus[]>;
formatAbilityBonusChoices(bonus_choices: ChoiceMongo | undefined, system: string): Promise<ChoiceApi<AttributeBonus> | undefined>;
```

Estos dos métodos son **lógica de presentación/formateo**, no operaciones de persistencia. Al estar en la interfaz del repositorio, se viola el principio de que los repositorios solo deben exponer operaciones CRUD y de consulta. Esta lógica de transformación pertenece al **servicio de dominio** (`AttributeService`) o a un mapper dedicado.

---

### 2. 🔴 Comentario de código "TODO" dejado accidentalmente en producción

En `attribute.service.ts` (líneas 20-22) hay un bloque de comentarios que claramente son notas de desarrollo que se olvidaron eliminar:

```typescript
// Mongoose models allow us to use AttributeModel.findById but since we only have repository methods,
// we can just add a getById if it exists. Wait, I don't have getById in IAttributeRepository!
// I will just add an ad-hoc check in the repository or just fetch the list of attributes for the system.
// Actually, wait, it's easier to add getById in the repository.
```

Estos comentarios exponen el proceso mental del desarrollador y no aportan valor en producción. Deben eliminarse.

---

### 3. 🔴 La ruta `GET /attributes` (listado) no existe
El módulo solo expone rutas de mutación: `POST`, `PUT`, `DELETE`, `PATCH /restore`. No hay ningún endpoint `GET /attributes` para consultar atributos por sistema, a pesar de que `IAttributeRepository.getBySystems` y `AttributeService.getBySystems` existen y están implementados. Cualquier cliente que quiera consultar las características de un sistema no tiene endpoint dedicado en este módulo.

> [!NOTE]
> Es posible que `getBySystems` se llame internamente desde otros módulos (ej. `personajeController` o `systemController`), pero si es un recurso válido de la API, debería tener su propio endpoint `GET` documentado.

---

### 4. 🔴 `create` pasa `req.body` directamente al use-case sin extraer `userId`

```typescript
// attribute.controller.ts - línea 20
const data = await this.createAttributeUseCase.execute(req.body);
```

El controlador `create` no extrae ni propaga el `userId` del usuario autenticado (`req.user`). Esto significa que **no se valida que el usuario tenga permiso sobre el sistema (`ruleset`) al que pertenece el atributo que está creando**. Cualquier usuario autenticado puede crear un atributo en cualquier sistema, independientemente de si es el `publisher` de ese sistema o no.

Comparado con `delete` y `restore`, que sí comprueban la propiedad en el use-case, `create` carece de esta comprobación de autorización.

---

### 5. 🔴 `update` tampoco verifica la propiedad del sistema

```typescript
// attribute.controller.ts - líneas 36-39
const data = await this.updateAttributeUseCase.execute({
  id,
  ...req.body
});
```

Similar al punto anterior: `update` no verifica que el usuario autenticado sea el propietario del sistema al que pertenece el atributo que se modifica. Solo `delete` y `restore` aplican la verificación de autorización. Esta inconsistencia representa una **vulnerabilidad de autorización** donde un usuario puede modificar atributos de sistemas ajenos.

---

### 6. 🟡 Inconsistencia en manejo de errores del controlador entre métodos

Los métodos `create` y `update` delegan todos los errores directamente a `next(e)`:
```typescript
// create y update
} catch (e) {
  console.error("...", e);
  next(e);
}
```

Pero `delete` y `restore` tienen una guardia adicional que intercepta mensajes de error específicos y los convierte en `AppError` antes de pasar a `next`:
```typescript
// delete y restore
} catch (e: any) {
  if (e.message === 'No tienes permisos...' || ...) {
    return next(new AppError(e.message, ...));
  }
  next(e);
}
```

Esto es inconsistente y frágil: la guardia compara con **strings literales en español**. Si el mensaje de error en el use-case cambia, la guardia dejará de funcionar silenciosamente y el error llegaría al handler genérico como un 500. La solución correcta es que los use-cases ya lancen `AppError` directamente (lo que ya hacen, líneas 14, 19, 23 de los use-cases), y el controlador solo necesita `next(e)`. La guardia es código redundante.

---

### 7. 🟡 `AddSystemSchema` importada pero no utilizada en las rutas

```typescript
// attribute.routes.ts - línea 5
import { CreateAttributeSchema, UpdateAttributeSchema, AddSystemSchema } from "../schemas/attribute.schema";
```

`AddSystemSchema` se importa en `attribute.routes.ts` pero **no se usa en ninguna ruta** del archivo. Es un import muerto que genera ruido.

---

### 8. 🟡 `AttributeApi` expone `deletedAt` al cliente

```typescript
// attribute.types.ts - línea 22
export interface AttributeApi {
  deletedAt?: Date;
  ...
}
```

El campo `deletedAt` es un campo interno de implementación del soft delete. Al estar en el tipo `AttributeApi`, se serializa en las respuestas JSON enviadas al cliente. Los clientes no necesitan saber de este campo interno, y su exposición puede llevar a confusión o a que el cliente tenga que filtrar por su cuenta los atributos borrados en lugar de que sea el servidor quien lo haga.

---

### 9. 🟡 `restoreByRuleset` usa `deletedAt` como criterio de restore (frágil)

```typescript
// attribute.repository.ts - línea 139
async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
  await AttributeSchema.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
}
```

La query filtra por `{ ruleset, deletedAt }` usando el timestamp exacto del borrado para restaurar. Esto supone que se restauran **exactamente** los atributos borrados en ese preciso instante. Si un atributo del mismo ruleset fue borrado en otro momento, no se restaurará. Aunque el timestamp se pasa desde la capa superior (lo que hace que sea determinista), esta dependencia temporal es frágil y puede ser difícil de razonar.

---

### 10. 🟢 `getById` no usa `.lean()` en el repositorio

```typescript
// attribute.repository.ts - líneas 121-124
async getById(id: string): Promise<AttributeApi | null> {
  const attribute = await AttributeSchema.findById(id);
  if (!attribute) return null;
  return this.formatAttribute(attribute);
}
```

A diferencia de `UserRepository` que usa `.lean()` correctamente, `getById` en `AttributeRepository` no lo hace. Para el caso de `getById` (que solo lee y formatea), esto es un gasto de memoria innecesario al cargar el objeto Mongoose completo con todos sus métodos y propiedades de Mongoose en vez del POJO plano. Se debería añadir `.lean<AttributeMongo>()`.

---

## 📊 Resumen

| Capa | Calidad | Comentario |
|---|---|---|
| `attribute.routes.ts` | 🟡 Bueno | Import muerto, falta endpoint GET |
| `attribute.controller.ts` | 🔴 Problemas | Sin autorización en create/update, guardia de errores frágil y redundante |
| `attribute.schema.ts` | ✅ Bueno | Validación Zod correcta con `refine` |
| Use-cases (softDelete/restore) | ✅ Excelente | Patrón orquestador bien aplicado |
| Use-cases (create/update) | 🟡 Correcto | Wrappers simples, sin lógica de autorización |
| `attribute.service.ts` | 🟡 Correcto | Comentarios TODO en producción, `systemRepository` opcional innecesariamente |
| `IAttributeRepository.ts` | 🔴 Problema | Expone métodos de formateo, violando el contrato de repositorio |
| `attribute.repository.ts` | 🟡 Correcto | `getById` sin `.lean()`, `restoreByRuleset` con acoplamiento temporal |
| `attribute.types.ts` | 🟡 Aceptable | `deletedAt` expuesto en el DTO de API |

### Acciones Prioritarias

| Prioridad | Problema | Acción |
|---|---|---|
| 🔴 Alta | Sin autorización en `create` y `update` | Añadir verificación de `publisher` en los use-cases correspondientes |
| 🔴 Alta | `formatAbilityBonuses/Choices` en `IAttributeRepository` | Mover esa lógica al servicio o a un mapper |
| 🔴 Alta | Falta endpoint `GET /attributes` | Crear handler `getAttributesBySystems` y registrar la ruta |
| 🔴 Alta | Comentario TODO en `attribute.service.ts` | Eliminar las líneas 20-22 |
| 🟡 Media | Guardia de errores frágil con strings en `delete`/`restore` | Eliminar la guardia y dejar solo `next(e)` ya que los use-cases lanzan `AppError` |
| 🟡 Media | Import muerto `AddSystemSchema` en routes | Eliminar la importación no utilizada |
| 🟡 Media | `deletedAt` expuesto en `AttributeApi` | Crear un tipo `AttributeApiPublic` sin `deletedAt` para las respuestas |
| 🟢 Baja | `getById` sin `.lean()` | Añadir `.lean<AttributeMongo>()` a la consulta |

---

## Módulo de Habilidades (`skill.routes.ts` y derivados) — 2026-07-13

**Archivos auditados:**
- [`src/infrastructure/http/routes/skill.routes.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/routes/skill.routes.ts)
- [`src/infrastructure/http/controllers/skill.controller.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/controllers/skill.controller.ts)
- [`src/infrastructure/http/schemas/skill.schema.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/schemas/skill.schema.ts)
- [`src/application/use-cases/skill/`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/application/use-cases/skill/) _(createSkill, updateSkill, softDeleteSkill, restoreSkill, getSkillsBySystems)_
- [`src/domain/services/skill.service.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/services/skill.service.ts)
- [`src/domain/repositories/ISkillRepository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/repositories/ISkillRepository.ts)
- [`src/domain/types/skill.types.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/types/skill.types.ts)
- [`src/infrastructure/databases/mongoDb/repositories/skill.repository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/databases/mongoDb/repositories/skill.repository.ts)

---

## ✅ Puntos Fuertes

### 1. Expansión de ancestros gestionada correctamente en el Use-Case
`GetSkillsBySystems` delega en `SystemService.getSystemsAndAncestors` antes de consultar el repositorio, siguiendo la regla 6 del AGENTS.md. El repositorio recibe los rulesets ya expandidos y se limita a ejecutar el filtro `$in` sin necesitar conocer la jerarquía del sistema. Esto es una mejora respecto al módulo de atributos donde la expansión ocurre dentro del propio repositorio.

### 2. Comportamiento flexible `getAll` vs `getBySystems` en el Use-Case
`GetSkillsBySystems.execute` toma `systems?: string[]` como parámetro opcional. Si no se proporcionan, devuelve **todas** las habilidades; si se proporcionan, filtra por sistema. Esta lógica está apropiadamente encapsulada en el use-case, no en el controlador ni en el repositorio.

### 3. Soft delete y restore con soporte de cascada
Al igual que en atributos, `softDeleteByRuleset` y `restoreByRuleset` permiten operar sobre todas las habilidades de un sistema de golpe, preparando el módulo para las operaciones de borrado/restauración en cascada del sistema padre.

### 4. `GetCharacterSkills` encapsula cálculo de modificadores complejos
El método `getCharacterSkills` en el repositorio calcula correctamente los modificadores de cada habilidad teniendo en cuenta la competencia, la doble competencia (`jackOfAllTrades`), y el `bonusFormula` personalizado si está definido. Esta lógica de presentación de personaje está bien agrupada.

### 5. Validaciones Zod coherentes
- `CreateSkillSchema` exige al menos un elemento en `attributeScore` (`.min(1)`).
- `UpdateSkillSchema` usa `.refine()` para exigir al menos un campo, evitando actualizaciones vacías.
- Ambos se aplican como middleware en la ruta antes del controlador.

### 6. Swagger completo para todos los endpoints
Los cuatro endpoints (`POST`, `PUT`, `DELETE`, `PATCH /restore`) están documentados con sus esquemas de entrada, respuesta y seguridad.

### 7. `getBySystems` admite `includeDeleted` como parámetro opcional
La firma `getBySystems(rulesets: string[], includeDeleted: boolean = false)` permite recuperar habilidades borradas cuando sea necesario (por ejemplo en contextos de administración), sin necesitar una query separada.

---

## ⚠️ Puntos Débiles y Problemas

### 1. 🔴 Método `obtenerTodas` del controlador no está registrado en ninguna ruta

El controlador `SkillController` tiene el método `obtenerTodas` perfectamente implementado (líneas 20-34), con lógica para parsear el query param `ruleset` en array, y delegando en `GetSkillsBySystems`. Sin embargo, **no hay ninguna ruta en `skill.routes.ts` que lo registre**. El endpoint `GET /skills` no existe aunque el use-case y el handler están listos. Los clientes no pueden consultar las habilidades disponibles por sistema.

---

### 2. 🔴 `create` y `update` no verifican autorización sobre el sistema

Exactamente el mismo problema que en el módulo de atributos: `create` pasa `req.body` directamente al use-case sin verificar que `req.user` sea el `publisher` del sistema al que pertenece la habilidad. `update` tampoco verifica pertenencia. Solo `delete` y `restore` comprueban la propiedad.

```typescript
// skill.controller.ts - línea 38
const data = await this.createSkillUseCase.execute(req.body);
```

Esto permite que cualquier usuario autenticado cree o modifique habilidades de sistemas ajenos.

---

### 3. 🔴 `ISkillRepository` expone métodos de formateo y lógica de negocio

Al igual que `IAttributeRepository`, la interfaz del repositorio de habilidades incluye métodos que no son operaciones de persistencia pura:

```typescript
// ISkillRepository.ts
getCharacterSkills(skills, double_skills, attributes, profBonus, hasJackOfAllTrades): Promise<SkillPersonajeApi[]>;
formatSkillChoices(options: ChoiceMongo | undefined): Promise<ChoiceApi<SkillApi> | undefined>;
```

`getCharacterSkills` calcula modificadores de personaje — es **lógica de negocio** que mezcla persistencia con cálculos de dominio. `formatSkillChoices` es lógica de formateo/presentación. Ambos violan la responsabilidad del repositorio de exponer solo acceso a datos. Deberían residir en `SkillService` o en un servicio de dominio de personaje.

---

### 4. 🔴 `create` no detecta ni gestiona unicidad de clave duplicada

A diferencia del repositorio de atributos (que captura el error `code 11000` y lanza `ConflictError`), `skill.repository.ts` **no tiene manejo de error de índice único**:

```typescript
// skill.repository.ts - líneas 13-25
async create(data: InputCreateSkill): Promise<SkillApi> {
  const newSkill = new SkillSchema({ ... });
  await newSkill.save(); // Sin try/catch ni detección de 11000
  return this.formatSkill(newSkill);
}
```

Si se intenta crear una habilidad con una `key` duplicada en el mismo sistema, MongoDB lanzará un error crudo que llegará al cliente como un 500. Además, el Swagger de `POST /skills` no documenta el código `409`, porque nunca se lanzará de forma controlada.

---

### 5. 🔴 `getBySystems` en el repositorio NO expande ancestros (doble expansión en el use-case)

En el módulo de atributos, la expansión de sistemas ancestros ocurre **dentro del propio repositorio** (`attribute.repository.ts` llama a `this.systemRepository.getSystemsAndAncestors`). En el módulo de habilidades, la expansión ocurre en el **use-case** (`GetSkillsBySystems` llama a `systemService.getSystemsAndAncestors`) y pasa los rulesets ya expandidos al repositorio.

Estas dos aproximaciones diferentes generan inconsistencia arquitectónica. Además, si `getBySystems` se llama desde otro contexto (ej. otro use-case o directamente desde el servicio), los sistemas ancestros **no se expandirán** y el resultado será incompleto. El contrato de `ISkillRepository.getBySystems` no especifica si los rulesets deben estar pre-expandidos o no.

---

### 6. 🟡 Guardia de errores idéntica al módulo de atributos (mismo problema, mismo patrón)

`delete` y `restore` en `skill.controller.ts` comparan mensajes de error con strings literales en español para distinguir 404 de 403:

```typescript
// skill.controller.ts - línea 76
if (e.message === 'No tienes permisos para borrar esta habilidad' || e.message === 'Sistema asociado no encontrado' || e.message === 'Habilidad no encontrada') {
  return next(new AppError(e.message, e.message.includes('encontrad') ? 404 : 403));
}
```

Los use-cases ya lanzan `AppError` directamente con el código correcto, por lo que esta guardia es redundante y frágil. El `errorHandler` global ya maneja `AppError` correctamente; solo se necesita `next(e)`.

---

### 7. 🟡 `skill.service.ts` tiene líneas en blanco innecesarias

Entre `update` y `getAll` hay dos líneas en blanco vacías (líneas 14-16). Es una inconsistencia menor pero evidencia código descuidado o no revisado antes de commit.

---

### 8. 🟡 `AddSystemSchema` importada pero no utilizada

```typescript
// skill.routes.ts - línea 4
import { CreateSkillSchema, UpdateSkillSchema, AddSystemSchema } from "../schemas/skill.schema";
```

`AddSystemSchema` se importa pero no se usa en ninguna ruta. El mismo problema detectado en `attribute.routes.ts`, probablemente residuo de un endpoint eliminado o planificado.

---

### 9. 🟡 `SkillApi` y `SkillMongo` exponen `deletedAt` (mismo problema que `AttributeApi`)

```typescript
// skill.types.ts - línea 22
export interface SkillApi {
  deletedAt?: Date;
}
```

`deletedAt` es un campo de implementación interna que se serializa en las respuestas al cliente. El mismo problema que en el módulo de atributos.

---

### 10. 🟡 Ninguna query en el repositorio usa `.lean()`

Ninguna de las consultas de `SkillRepository` (`getBySystems`, `getAll`, `getSkillsByKeys`, `getCharacterSkills`, `getById`) utiliza `.lean()`. Todas cargan el objeto Mongoose completo (con sus métodos internos, virtuals, etc.) cuando solo se necesita el POJO. Esto impacta negativamente en el consumo de memoria, especialmente en `getCharacterSkills` que carga todos los skills del sistema.

---

### 11. 🟢 `getBySystems` acepta `includeDeleted` pero el servicio no lo expone

```typescript
// ISkillRepository.ts - línea 8
getBySystems(rulesets: string[], includeDeleted?: boolean): Promise<SkillApi[]>;
```

El parámetro `includeDeleted` existe en la interfaz del repositorio y en la implementación, pero `SkillService.getBySystems` no lo expone en su firma:

```typescript
// skill.service.ts - línea 21
getBySystems(rulesets: string[]): Promise<SkillApi[]> {
  return this.skillRepository.getBySystems(rulesets); // No pasa includeDeleted
}
```

La funcionalidad está disponible en el repositorio pero es inaccesible desde capas superiores a través del servicio.

---

## 📊 Resumen

| Capa | Calidad | Comentario |
|---|---|---|
| `skill.routes.ts` | 🔴 Problema | Falta registrar `GET /skills`, import muerto |
| `skill.controller.ts` | 🔴 Problemas | `obtenerTodas` sin ruta, sin autorización en `create`/`update`, guardia frágil |
| `skill.schema.ts` | ✅ Bueno | Validaciones Zod correctas con `refine` |
| Use-case `getSkillsBySystems` | ✅ Bueno | Expansión de ancestros en el sitio correcto |
| Use-cases (softDelete/restore) | ✅ Excelente | Patrón orquestador correcto, verificación de `publisher` |
| Use-cases (create/update) | 🟡 Correcto | Sin autorización |
| `skill.service.ts` | 🟡 Correcto | Líneas en blanco extra, `includeDeleted` no expuesto |
| `ISkillRepository.ts` | 🔴 Problema | Expone `getCharacterSkills` y `formatSkillChoices` — lógica de negocio |
| `skill.repository.ts` | 🟡 Correcto | Sin `.lean()`, sin `ConflictError` en `create`, inconsistencia de expansión de ancestros |
| `skill.types.ts` | 🟡 Aceptable | `deletedAt` expuesto en `SkillApi` |

### Acciones Prioritarias

| Prioridad | Problema | Acción |
|---|---|---|
| 🔴 Alta | `GET /skills` no registrado | Registrar `router.get('/skills', authMiddleware, skillController.obtenerTodas)` |
| 🔴 Alta | Sin autorización en `create` y `update` | Añadir verificación de `publisher` en los use-cases |
| 🔴 Alta | Sin manejo de `ConflictError` (key duplicada) | Añadir try/catch con detección de `code 11000` en `skill.repository.ts` y documentar 409 en Swagger |
| 🔴 Alta | `getCharacterSkills` y `formatSkillChoices` en `ISkillRepository` | Mover al servicio o a un servicio de personaje |
| 🟡 Media | Inconsistencia de expansión de ancestros respecto a atributos | Decidir patrón canónico: expansión en repositorio o en use-case, y unificar |
| 🟡 Media | Guardia frágil con strings en `delete`/`restore` | Eliminar la guardia y dejar solo `next(e)` |
| 🟡 Media | Import muerto `AddSystemSchema` | Eliminar la importación no usada |
| 🟡 Media | `includeDeleted` inaccesible desde `SkillService` | Exponer el parámetro en `SkillService.getBySystems` |
| 🟢 Baja | Ninguna query usa `.lean()` | Añadir `.lean()` a todas las consultas de lectura del repositorio |
| 🟢 Baja | `deletedAt` expuesto en `SkillApi` | Crear un tipo público sin el campo interno |

---

## Módulo de Sistemas (`system.routes.ts` y derivados) — 2026-07-13

**Archivos auditados:**
- [`src/infrastructure/http/routes/system.routes.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/routes/system.routes.ts)
- [`src/infrastructure/http/controllers/system.controller.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/controllers/system.controller.ts)
- [`src/infrastructure/http/schemas/system.schema.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/schemas/system.schema.ts)
- [`src/application/use-cases/system/`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/application/use-cases/system/) _(createSystem, updateSystem, getSystemsByUser, getSystemApi, cascadeSoftDeleteSystem, cascadeRestoreSystem)_
- [`src/domain/services/system.service.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/services/system.service.ts)
- [`src/domain/repositories/ISystemRepository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/repositories/ISystemRepository.ts)
- [`src/domain/types/system.types.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/types/system.types.ts)
- [`src/infrastructure/databases/mongoDb/repositories/system.repository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/databases/mongoDb/repositories/system.repository.ts)

---

## ✅ Puntos Fuertes

### 1. `CascadeSoftDeleteSystem` y `CascadeRestoreSystem` — patrón orquestador ejemplar
Estos dos use-cases son el mejor ejemplo del patrón orquestador del proyecto. Coordinan cuatro repositorios en paralelo usando `Promise.all`:

```typescript
await Promise.all([
  this.attributeRepository.softDeleteByRuleset(id, deletedAt),
  this.skillRepository.softDeleteByRuleset(id, deletedAt),
  this.languageRepository.softDeleteByRuleset(id, deletedAt)
]);
```

Las operaciones de cascada son atómicas en tiempo (comparten el mismo `deletedAt`), lo que garantiza coherencia al restaurar. Verifican autorización (`publisher === userId`) antes de actuar. Están perfectamente alineados con la regla 12 del AGENTS.md.

### 2. `GetSystemApi` — use-case compositor complejo y bien estructurado
`GetSystemApi` es el use-case más complejo del proyecto. Recopila atributos y habilidades de toda la cadena de ancestros, resuelve el nombre del publicador, calcula `canEdit`, y hereda fórmulas escalares (`getMergedScalar`). A pesar de esa complejidad, está correctamente separado en pasos numerados con comentarios claros. El recorrido de ancestros con `visited` para evitar ciclos es una medida de seguridad correcta.

### 3. Autorización en `createSystem` injecting `userId` desde el controlador
El controlador inyecta correctamente el `userId` como `publisher`:

```typescript
const data = await this.createSystemUseCase.execute({
  ...req.body,
  publisher: userId
});
```

El cliente no puede falsificar el campo `publisher`; siempre se sobreescribe con el token JWT. Esto es una práctica de seguridad correcta.

### 4. `getByUserId` incluye sistemas abiertos y accesibles
La query en `system.repository.ts` combina tres condiciones con `$or`: sistemas propios del usuario, sistemas `isOpen`, y sistemas con acceso explícito. Esto da una visión completa y correcta de los sistemas accesibles sin requerir lógica adicional en capas superiores.

### 5. Validación de `ObjectId` antes de las queries MongoDB
El repositorio valida `mongoose.Types.ObjectId.isValid(id)` antes de ejecutar cualquier query por ID, evitando `CastError` de Mongoose y retornando `null` de forma controlada. Esto es correcto y evita errores 500 innecesarios.

### 6. Zod `UpdateSystemSchema` con `.refine()` y soporte de `parentId: null`
`UpdateSystemSchema` usa `.refine()` para exigir al menos un campo. Además, `parentId` acepta `z.string().nullable().optional()`, lo que permite desconectar un sistema de su padre enviando `parentId: null` explícitamente. Esto es un detalle de diseño correcto y flexible.

### 7. Swagger detallado con los campos correctos
La documentación `@openapi` en `system.routes.ts` es la más completa del proyecto. Todos los campos del schema `SystemApi` están documentados con sus tipos y descripciones, incluyendo campos heredados (`attributes`, `skills`, `racesCount`).

---

## ⚠️ Puntos Débiles y Problemas

### 1. 🔴 `system.service.ts` lanza `Error` genérico en lugar de `AppError`

```typescript
// system.service.ts - líneas 18 y 22
throw new Error('Sistema no encontrado');
throw new Error('No tienes permisos de edición para este sistema');
```

El dominio lanza `Error` genérico en lugar de `AppError`. Esto rompe el flujo de manejo centralizado de errores: el `errorHandler` global solo gestiona `AppError`, por lo que estos errores llegarán como 500 en lugar de 404 y 403. El controlador tiene que compensar con una guardia manual de strings:

```typescript
// system.controller.ts - líneas 59-61
if (e.message === 'No tienes permisos de edición para este sistema' || e.message === 'Sistema no encontrado') {
  return next(new AppError(e.message, 403));
}
```

Además, el `403` se aplica indiscriminadamente a ambos mensajes, **incluyendo "Sistema no encontrado" que debería ser `404`**. Este es un bug real: si el sistema no existe, el cliente recibe `403` en lugar de `404`.

---

### 2. 🔴 `ISystemRepository` tiene `getById` y `obtenerPorId` como métodos duplicados

```typescript
// ISystemRepository.ts - líneas 7-8
getById(id: string): Promise<System | null>;
obtenerPorId(id: string): Promise<System | null>;
```

Ambos métodos hacen exactamente lo mismo. En `system.repository.ts` `obtenerPorId` es simplemente `return this.getById(id)`. En `system.service.ts` existen también `getById` y `obtenerPorId` que llaman al mismo método del repositorio. Esto es código duplicado en tres capas (interfaz, repositorio y servicio) fruto de la migración progresiva de Spanglish a inglés que no se completó.

---

### 3. 🔴 `GetSystemApi` accede directamente a los repositorios, violando la capa de aplicación

`GetSystemApi` recibe e inyecta directamente **repositorios** (`ISystemRepository`, `IUserRepository`, `IRazaRepository`, `IAttributeRepository`, `ISkillRepository`) en lugar de servicios de dominio:

```typescript
// getSystemApi.use-case.ts - líneas 11-17
constructor(
  private readonly systemRepository: ISystemRepository,
  private readonly userRepository: IUserRepository,
  private readonly razaRepository: IRazaRepository,
  private readonly attributeRepository: IAttributeRepository,
  private readonly skillRepository: ISkillRepository
) {}
```

Los use-cases deben comunicarse con **servicios de dominio**, no directamente con repositorios (salvo excepciones justificadas como los orquestadores de cascada). Esto acopla el use-case a detalles de infraestructura e introduce dependencias cruzadas difíciles de testear.

---

### 4. 🔴 `GetSystemApi` realiza consultas N+1 por ancestro para atributos y habilidades

```typescript
// getSystemApi.use-case.ts - líneas 59-67
for (let i = ancestry.length - 1; i >= 0; i--) {
  const ancestor = ancestry[i];
  const sysAttrs = await this.attributeRepository.getBySystems([ancestor._id.toString(), ancestor.name]);
  // ...
}
```

Para cada ancestro del sistema se lanza una query a MongoDB para atributos y otra para habilidades. Si un sistema tiene 3 niveles de herencia, se ejecutan **6 queries adicionales** (2 por ancestro × 3 ancestros) solo para construir la respuesta de un sistema. Este es un problema de **N+1 queries** que puede degradar notablemente el rendimiento en sistemas con jerarquías profundas.

La solución ideal sería obtener todos los IDs de ancestros primero y ejecutar una sola query con `$in` para todos ellos.

---

### 5. 🔴 `getSystemApi.use-case.ts` llama a `getBySystems` en `attributeRepository` sin expandir ancestros

En la línea 62 de `getSystemApi.use-case.ts`:
```typescript
const sysAttrs = await this.attributeRepository.getBySystems([ancestor._id.toString(), ancestor.name]);
```

Aquí `getBySystems` del repositorio de atributos **sí expande ancestros internamente** (`getSystemsAndAncestors` dentro del propio repositorio). Pero el use-case ya está iterando la cadena de ancestros manualmente. Esto provoca una **doble expansión de ancestros** y posibles resultados duplicados en la respuesta al cliente.

---

### 6. 🟡 `getByUserId` no filtra los sistemas propios borrados (`deletedAt`)

```typescript
// system.repository.ts - líneas 72-90
const query: any = {
  $or: [
    { publisher: userId },          // ← No filtra deletedAt: null
    { isOpen: true, deletedAt: null }
  ]
};
```

Los sistemas con `isOpen: true` sí filtran `deletedAt: null`, pero los sistemas propios del usuario (`publisher: userId`) **no filtran los borrados**. Un usuario que borra su propio sistema seguirá viéndolo en su lista, aunque esté marcado como `deletedAt`. Probablemente sea intencional (para que el publisher pueda restaurarlo), pero debería estar documentado explícitamente o haber un endpoint diferenciado para sistemas borrados.

---

### 7. 🟡 `GetSystemApi` recibe el objeto `System` completo como parámetro, no el ID

```typescript
// createSystem.use-case.ts - línea 14
return this.getSystemApi.execute(system, data.publisher);
```

`GetSystemApi.execute` recibe el objeto `System` completo. Esto significa que el use-case `CreateSystem` debe recuperar el sistema recién creado del repositorio y pasárselo. Si en el futuro se necesita llamar a `GetSystemApi` desde otro contexto con solo el ID, se requeriría una query adicional previa. Sería más flexible aceptar un ID y recuperar el sistema internamente.

---

### 8. 🟡 `update` en `system.repository.ts` usa `any` para `updateFields`

```typescript
// system.repository.ts - línea 121
const updateFields: any = {};
```

El tipado `any` para el objeto de actualización elimina la seguridad de tipos en la construcción del objeto. Si se añade un nuevo campo a `TypeModificarSystem`, el compilador no avisará si se olvida añadirlo aquí. Se podría usar `Partial<TypeModificarSystem>` o un tipo mapeado.

---

### 9. 🟡 `SystemApi` expone `deletedAt` al cliente

```typescript
// system.types.ts - línea 45
export interface SystemApi {
  deletedAt?: Date;
}
```

El mismo problema detectado en `AttributeApi` y `SkillApi`: campo de implementación interna expuesto en el DTO de respuesta pública.

---

### 10. 🟡 `getAncestry` en el repositorio duplica la lógica de `GetSystemApi`

El repositorio tiene un método privado `getAncestry` (líneas 10-23) para recorrer la cadena de herencia de sistemas, y `GetSystemApi` (use-case) implementa la misma lógica de recorrido de ancestros de forma independiente (líneas 21-31). Esta duplicación supone un riesgo de divergencia: si se cambia el comportamiento del recorrido (p.ej. incluir sistemas borrados en la cadena), habría que actualizarlo en dos sitios.

---

### 11. 🟢 `System` tiene el campo `maxAttributeValue` sin usar

```typescript
// system.types.ts - línea 15
maxAttributeValue?: number;
```

El campo `maxAttributeValue` aparece en la interfaz `System` pero no en `TypeCrearSystem`, `TypeModificarSystem`, ni en `SystemApi`. No se crea ni se expone. Parece un campo legacy o un vestigio de un diseño anterior que nunca se limpió.

---

## 📊 Resumen

| Capa | Calidad | Comentario |
|---|---|---|
| `system.routes.ts` | ✅ Bueno | Swagger detallado, todos los endpoints documentados |
| `system.controller.ts` | 🟡 Correcto | Guardia de strings frágil, 404 enviado como 403 en `update` |
| `system.schema.ts` | ✅ Bueno | Zod correcto, `refine`, soporte `parentId: null` |
| Use-case `cascadeSoftDelete/Restore` | ✅ Excelente | Patrón orquestador ejemplar, `Promise.all` con timestamp compartido |
| Use-case `getSystemApi` | 🔴 Problemas | N+1 queries, doble expansión de ancestros, depende de repositorios directamente |
| Use-case `getSystemsByUser` | ✅ Bueno | Limpio y correcto |
| Use-case `createSystem`/`updateSystem` | ✅ Bueno | `publisher` inyectado desde controller |
| `system.service.ts` | 🔴 Problema | Lanza `Error` genérico en lugar de `AppError` |
| `ISystemRepository.ts` | 🔴 Problema | `getById`/`obtenerPorId` duplicados |
| `system.repository.ts` | 🟡 Correcto | `any` en updateFields, `getAncestry` duplicado con use-case, `getByUserId` no filtra borrados propios |
| `system.types.ts` | 🟡 Aceptable | `deletedAt` y `maxAttributeValue` sin usar expuestos |

### Acciones Prioritarias

| Prioridad | Problema | Acción |
|---|---|---|
| 🔴 Alta | `system.service.ts` lanza `Error` genérico | Cambiar a `AppError` con los códigos correctos (404 y 403) |
| 🔴 Alta | `404` de "Sistema no encontrado" en `update` devuelve `403` | Corregir la guardia del controlador para mapear correctamente el código HTTP |
| 🔴 Alta | N+1 queries en `GetSystemApi` | Obtener todos los IDs de ancestros primero y ejecutar una sola query `$in` por tipo de entidad |
| 🔴 Alta | Doble expansión de ancestros en `GetSystemApi` | Revisar y eliminar la expansión redundante al llamar a `attributeRepository.getBySystems` dentro del loop de ancestros |
| 🔴 Alta | `getById` y `obtenerPorId` duplicados | Eliminar `obtenerPorId` de la interfaz y unificar bajo `getById` |
| 🔴 Alta | `GetSystemApi` inyecta repositorios directamente | Refactorizar para usar servicios de dominio en lugar de repositorios |
| 🟡 Media | Guardia de strings frágil en todos los métodos del controlador | Reemplazar por `next(e)` directo, ya que los use-cases y services deben lanzar `AppError` |
| 🟡 Media | `getByUserId` no filtra sistemas propios borrados | Aclarar si es intencional y documentarlo, o añadir `deletedAt: null` a la condición del publisher |
| 🟡 Media | `updateFields: any` en el repositorio | Tipar correctamente con `Partial<Record<keyof TypeModificarSystem, unknown>>` |
| 🟢 Baja | `maxAttributeValue` huérfano en `system.types.ts` | Eliminar el campo si no se usa |
| 🟢 Baja | `deletedAt` en `SystemApi` | Crear tipo público sin campo interno |

---

## Módulo de Rasgos (`trait.routes.ts` y derivados) — ✅ Corregido (2026-07-20)

**Archivos auditados:**
- [`src/infrastructure/http/routes/trait.routes.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/routes/trait.routes.ts)
- [`src/infrastructure/http/controllers/trait.controller.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/controllers/trait.controller.ts)
- [`src/infrastructure/http/schemas/trait.schema.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/http/schemas/trait.schema.ts)
- [`src/application/use-cases/trait/`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/application/use-cases/trait/) _(createTrait, updateTrait, getTraitsBySystems, softDeleteTrait, restoreTrait)_
- [`src/domain/services/trait.service.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/services/trait.service.ts)
- [`src/domain/repositories/ITraitRepository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/repositories/ITraitRepository.ts)
- [`src/domain/types/traits.types.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/domain/types/traits.types.ts)
- [`src/infrastructure/databases/mongoDb/repositories/trait.repository.ts`](file:///d:/Documents/Programacion/DragonesMazmorras/dnd-api/src/infrastructure/databases/mongoDb/repositories/trait.repository.ts)

---

## ✅ Puntos Fuertes

### 1. `SoftDeleteTrait` y `RestoreTrait` — patrón orquestador correcto
Ambos use-cases siguen el mismo patrón que habilidades y atributos: verifican existencia del rasgo, buscan el sistema asociado y comprueban que `publisher === userId` antes de ejecutar la operación. Lanzan `AppError` con los códigos HTTP correctos (404/403).

### 2. `formatearTrait` — enriquecimiento declarativo rico
El método privado `formatearTrait` del repositorio reúne hasta **5 entidades relacionadas** (daños, daños condicionales, competencias, conjuros, estados de condición) para construir el `TraitApi` completo. La lógica de sustitución de plantillas en los textos (`replaceAll(d, traitData[d])`) mediante `TraitDataMongo` es un mecanismo flexible para personalizar descripciones por personaje.

### 3. `TraitRepository` inyecta sus dependencias vía constructor
`TraitRepository` recibe `IDañoRepository`, `ICompetenciaRepository`, `IConjuroRepository`, `IEstadoRepository` e `ISystemRepository` por constructor, cumpliendo con el principio de inyección de dependencias. Usa las interfaces de dominio, no implementaciones concretas.

### 4. Expansión de ancestros delegada al repositorio del sistema
`getBySystems` llama a `this.systemRepository.getSystemsAndAncestors(ruleset)` y aplica el filtro `$in` con los rulesets expandidos:
```typescript
const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(ruleset);
const traits = await TraitSchema.find({ ruleset: { $in: expandedRulesets }, deletedAt: null });
```
Esto respeta la regla 6 del AGENTS.md y sigue el mismo patrón que el módulo de habilidades.

### 5. `getById` filtra con `deletedAt: null`
A diferencia de `skill.repository.ts`, el `getById` de traits sí filtra los borrados: `findOne({ _id, deletedAt: null })`. Esto evita que un use-case de borrado o restauración actúe sobre un rasgo ya eliminado.

### 6. Swagger coherente para los 5 endpoints
Los schemas `Trait`, `InputCreateTrait` e `InputUpdateTrait` están documentados con todos sus campos en español, incluyendo `incompatible_traits` referenciado como `$ref: '#/components/schemas/Trait'` (self-referential).

---

## ⚠️ Puntos Débiles y Problemas

### 1. 🔴 `TraitRepository` inyecta `ISystemRepository` directamente — viola arquitectura hexagonal

```typescript
// trait.repository.ts - líneas 13-19
constructor(
  private readonly dañoRepository: IDañoRepository,
  ...
  private readonly systemRepository: ISystemRepository
) {}
```

Un repositorio no debe importar ni usar el repositorio de otro agregado directamente (regla 3 y 12 del AGENTS.md). La expansión de ancestros debería ocurrir en un use-case o servicio de dominio, no dentro del propio repositorio. Esto crea un acoplamiento entre infraestructuras que dificulta el testing unitario del repositorio de traits de forma aislada.

---

### 2. 🔴 `update` en `trait.repository.ts` lanza `Error` genérico en lugar de `AppError`

```typescript
// trait.repository.ts - línea 73
if (!traitUpdated) {
  throw new Error("Trait no encontrado");
}
```

Al igual que en `system.service.ts`, el repositorio lanza un `Error` genérico. El `errorHandler` global no lo captura como un error controlado y el cliente recibirá un 500. Debería lanzar `NotFoundError` o `AppError("Trait no encontrado", 404)`.

---

### 3. 🔴 `update` pasa el objeto `trait` completo (con `id`) al `$set` de MongoDB

```typescript
// trait.repository.ts - líneas 67-71
const traitUpdated = await TraitSchema.findByIdAndUpdate(
  trait.id,
  trait,        // ← Pasa el objeto completo sin $set ni desestructuración
  { returnDocument: 'after' }
);
```

Al pasar `trait` directamente sin `{ $set: updateFields }`, Mongoose intentará sobrescribir el documento completo con todos los campos del objeto, **incluyendo el campo `id`** que no existe en el schema de Mongoose. Esto puede resultar en:
- Intentos de escribir campos no definidos en el schema.
- Si el schema tiene `strict: true` (por defecto), los campos extra se ignoran, pero el campo `id` se incluye en la operación y puede causar comportamiento inesperado.
- Si algún campo del input fuera `undefined`, ese campo se borraría del documento (MongoDB trata `undefined` distinto de `null`).

La práctica correcta es desestructurar `{ id, ...updateFields }` y usar `{ $set: updateFields }`.

---

### 4. 🔴 `create` y `update` no verifican autorización sobre el sistema

Exactamente el mismo problema que en atributos, habilidades y rasgos: cualquier usuario autenticado puede crear rasgos en sistemas ajenos. El controlador pasa `req.body` directamente sin verificar que `req.user` sea el `publisher` del sistema al que pertenece el rasgo.

```typescript
// trait.controller.ts - línea 39
const trait = await this.createTraitUseCase.execute(req.body);
```

---

### 5. 🔴 `getTraitsBySystems` use-case no expande los ancestros del sistema

```typescript
// getTraitsBySystems.use-case.ts
execute(ruleset: string[]): Promise<TraitApi[]> {
  return this.traitService.getBySystems(ruleset);
}
```

A diferencia de `GetSkillsBySystems`, este use-case no llama a `SystemService.getSystemsAndAncestors` antes de delegar. La expansión de ancestros ocurre **dentro del repositorio** (`trait.repository.ts` llama a `systemRepository.getSystemsAndAncestors`), lo que viola la regla 3 del AGENTS.md (repositorios no deben usar repositorios de otras entidades). El use-case debería ser responsable de la expansión.

---

### 6. 🔴 `formatearTrait` ejecuta consultas N+1 por cada rasgo

```typescript
// trait.repository.ts - líneas 90-128
private async formatearTrait(trait: TraitMongo, data: TraitDataMongo): Promise<TraitApi> {
  const resistances           = await this.dañoRepository.obtenerDañosPorIndices(...);
  const conditional_resistances = await this.dañoRepository.obtenerDañosPorIndices(...);
  const proficiencies         = await this.competenciaRepository.obtenerCompetenciasPorIndices(...);
  const spells                = await this.conjuroRepository.obtenerConjurosPorIndices(...);
  const condition_inmunities  = await this.estadoRepository.obtenerEstadosPorIndices(...);
  const incompatible_traits   = await this.getTraitsByIndexes(...);
}
```

Para cada rasgo se lanzan **6 queries secuenciales** a MongoDB (no paralelas con `Promise.all`). Si `getBySystems` devuelve 20 rasgos, el total es **120 queries** extra solo para formatear la respuesta. Este es el peor caso de N+1 queries de todo el proyecto. Además, `incompatible_traits` llama recursivamente a `getTraitsByIndexes`, lo que puede desencadenar otra cascada de queries.

---

### 7. 🔴 `formatearTrait` tiene lógica de template-substitution mezclada con formateo de datos

El método `formatearTrait` mezcla dos responsabilidades:
1. **Resolución de referencias** (cargar daños, conjuros, estados, competencias).
2. **Sustitución de plantillas** de texto (reemplazar tokens en `desc`, `description` y `summary` con valores de `TraitDataMongo`).

Esta mezcla hace el método difícil de testear y mantener. La sustitución de plantillas es lógica de presentación que debería estar en un servicio de dominio o en un caso de uso específico.

---

### 8. 🟡 Guardia de strings frágil en `delete` y `restore` del controlador — el mismo patrón reiterado

```typescript
// trait.controller.ts - línea 73
if (error.message === 'No tienes permisos para borrar este rasgo' || error.message === 'Sistema asociado no encontrado' || error.message === 'Trait no encontrado') {
  return next(new AppError(error.message, error.message.includes('encontrado') ? 404 : 403));
}
```

Los use-cases ya lanzan `AppError` con los códigos correctos. Esta guardia es redundante, frágil (depende de strings literales en español) y genera código muerto. Es el **cuarto módulo consecutivo** con este mismo patrón.

---

### 9. 🟡 `UpdateTrait` tiene todos los campos como requeridos — tipo demasiado restrictivo

```typescript
// traits.types.ts - líneas 80-88
export interface UpdateTrait {
  id: string,
  name: string,          // No es optional
  description: string[], // No es optional
  summary: string[],     // No es optional
  ruleset: string,       // No es optional
  incompatible_traits: string[] // No es optional
}
```

Todos los campos de `UpdateTrait` son obligatorios. Sin embargo, el `UpdateTraitSchema` de Zod los define como opcionales (`.optional()`). Hay una **inconsistencia entre el schema de validación y el tipo TypeScript**: el schema acepta actualizaciones parciales pero el tipo de dominio exige el objeto completo.

---

### 10. 🟡 `ITraitRepository` expone `getTraitsOptions` y `getTraitsByIndexes` — lógica de presentación en el contrato del repositorio

```typescript
// ITraitRepository.ts
getTraitsByIndexes(params: string[], data?: TraitDataMongo): Promise<TraitApi[]>
getTraitsOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined>
```

`getTraitsOptions` convierte una estructura de opciones de selección en un `TraitsOptionsApi` — esto es transformación de datos de presentación, no acceso a persistencia pura. `getTraitsByIndexes` acepta `TraitDataMongo` para la sustitución de plantillas, que es lógica de renderizado. Ambos violan la responsabilidad única del repositorio.

---

### 11. 🟡 `getBySystems` devuelve los rasgos sin ordenar

```typescript
// trait.repository.ts - líneas 21-25
async getBySystems(ruleset: string[]): Promise<TraitApi[]> {
  const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(ruleset);
  const traits = await TraitSchema.find({ ... });
  return this.formatearTraits(traits, {}); // Sin .sort()
}
```

A diferencia de `getSkillsByKeys` o `getAll` en skill.repository, `getBySystems` no ordena los resultados. La respuesta al cliente llegará en orden de inserción de MongoDB.

---

### 12. 🟢 `TraitMongo` tiene `desc` y `description` como campos alternativos — ambigüedad de schema

```typescript
// traits.types.ts - líneas 11 y 15
description?: string[],
desc?: string[],
```

Hay dos campos para la descripción (`description` y `desc`). La lógica en `formatearTrait` prioriza `description_aux` si tiene contenido, cayendo en `desc` si no:

```typescript
const description = (description_aux?.length ? description_aux : desc) ?? [];
```

Esto sugiere que `desc` es un campo legacy del schema de SRD (System Reference Document) que no se migró completamente a `description`. El schema de Mongoose tiene ambos campos vivos, creando ambigüedad en los datos y lógica de fallback defensiva.

---

## 📊 Resumen

| Capa | Calidad | Comentario |
|---|---|---|
| `trait.routes.ts` | ✅ Bueno | Swagger correcto, todos los endpoints definidos y con `GET /traits` funcional |
| `trait.controller.ts` | 🟡 Correcto | Guardia frágil reiterada, sin autorización en `create`/`update` |
| `trait.schema.ts` | 🟡 Aceptable | Zod con `refine`, pero inconsistente con el tipo `UpdateTrait` |
| Use-case `getTraitsBySystems` | 🔴 Problema | No expande ancestros — la expansión ocurre en el repositorio |
| Use-cases (softDelete/restore) | ✅ Excelente | Patrón correcto con `AppError` y verificación de `publisher` |
| Use-cases (create/update) | 🔴 Problema | Sin autorización sobre el sistema de destino |
| `trait.service.ts` | ✅ Correcto | Delgado, limpio, sin lógica extra |
| `ITraitRepository.ts` | 🟡 Aceptable | Expone métodos de transformación/presentación |
| `trait.repository.ts` | 🔴 Problemas críticos | N+1 queries masivas, `ISystemRepository` inyectado directamente, `Error` genérico en `update`, `$set` mal aplicado, mezcla de responsabilidades |
| `traits.types.ts` | 🟡 Aceptable | `UpdateTrait` no es parcial, campos `desc`/`description` ambiguos, `deletedAt` expuesto |

### Acciones Prioritarias

| Prioridad | Problema | Acción |
|---|---|---|
| 🔴 Alta | N+1 queries en `formatearTrait` | Paralelizar con `Promise.all` y, si es posible, batching de queries |
| 🔴 Alta | `ISystemRepository` inyectado en `TraitRepository` | Mover la expansión de ancestros al use-case `GetTraitsBySystems` vía `SystemService` |
| 🔴 Alta | `update` pasa objeto completo sin `$set` | Cambiar a `{ $set: updateFields }` con desestructuración de `id` |
| 🔴 Alta | `update` lanza `Error` genérico | Cambiar a `NotFoundError` o `AppError(..., 404)` |
| 🔴 Alta | Sin autorización en `create` y `update` | Añadir verificación de `publisher` en los use-cases |
| 🟡 Media | Guardia de strings frágil en `delete`/`restore` | Eliminar la guardia y dejar solo `next(error)` |
| 🟡 Media | `UpdateTrait` con todos los campos requeridos | Hacer todos los campos opcionales (excepto `id`) para consistencia con el schema Zod |
| 🟡 Media | `getTraitsOptions`/`getTraitsByIndexes` en `ITraitRepository` | Mover al servicio de dominio o a un servicio de personaje |
| 🟡 Media | `getBySystems` sin ordenar | Añadir `.collation` y `.sort({ name: 1 })` a la query |
| 🟢 Baja | Campo `desc` legacy junto a `description` | Migrar datos y eliminar `desc` del schema, usando solo `description` |
| 🟢 Baja | `deletedAt` en `TraitApi` | Crear tipo público sin el campo interno |
