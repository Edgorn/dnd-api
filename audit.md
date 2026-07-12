# Auditorías de Código — `dnd-api`

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

