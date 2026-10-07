import { Router } from "express";
import { systemController, authMiddleware } from "../../dependencies";
import { validateQuery, validateSchema } from "../middlewares/validateSchema";
import { CreateSystemSchema, ListSystemsQuerySchema, UpdateSystemSchema } from "../schemas/system.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SystemCharacterFormulaSyntax:
 *       type: string
 *       description: |
 *         Expresión matemática evaluada en el servidor que devuelve un número fijo (bono, valor o total).
 *         Tokens permitidos: `@attributes.{key}.modifier`, `@attributes.{key}.value`, `@class.{prop}` (ej. `@class.hitDie`),
 *         `@skills.{key}.totalModifier`, variables planas como `@proficiencyBonus` y `@level`, y tokens de arma
 *         `@weapon.attributeModifier`, `@weapon.attributeValue`, `@weapon.isProficient`, `@weapon.isMagic`,
 *         `@weapon.isRanged`, `@weapon.isTwoHanded`, `@weapon.hasProperty.{propertyId}` (0/1).
 *         Funciones: `max()`, `min()`. Condicionales ternarios (`? :`) y comparaciones (`>`, `<`, `==`).
 *         El placeholder `{skillName}` solo está permitido en `passiveSkillFormula`.
 *         Los tokens `@weapon.*` solo están permitidos en `attackBonusFormula` y `damageBonusFormula`.
 *         No se admite notación de dados (`1d20`, `2d6`), texto libre ni tokens desconocidos.
 *         Las tiradas de dados las resuelve el cliente; estas fórmulas solo calculan modificadores o totales numéricos.
 *     AttributeModifierFormulaSyntax:
 *       type: string
 *       description: |
 *         Fórmula del modificador de atributo. Usa `value` o `valor` como variable del puntuaje.
 *         Funciones permitidas: `Math.floor`, `Math.ceil`, `Math.round`, `Math.trunc`, `Math.abs`.
 *         Ejemplo: `Math.floor((valor - 10) / 2)`.
 *     SystemApi:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del sistema.
 *         name:
 *           type: string
 *           description: Nombre del sistema.
 *         description:
 *           type: string
 *           description: Descripción del sistema.
 *         publisher:
 *           type: string
 *           description: Nombre o ID del publicador.
 *         isOpen:
 *           type: boolean
 *           description: Indica si el sistema es abierto/público.
 *         isBase:
 *           type: boolean
 *           description: |
 *             Indica si el sistema es un motor de juego. Todo sistema, y todo personaje, debe resolver
 *             a una única base más específica. Un sistema sin padres se trata siempre como base.
 *         kind:
 *           type: string
 *           enum: [ruleset, setting, campaign]
 *           description: |
 *             Tipo de sistema. `ruleset` aporta reglas y contenido. `setting` y `campaign` son capas de contenido
 *             que heredan las fórmulas del ruleset ancestro. Los documentos antiguos sin tipo se tratan como `ruleset`.
 *         parentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             Identificadores de los sistemas padre, en orden de prioridad entre hermanos.
 *             `setting` y `campaign` exigen al menos un padre. El orden se usa en la linealización C3.
 *         canEdit:
 *           type: boolean
 *           description: Indica si el usuario autenticado tiene permisos de edición.
 *         racesCount:
 *           type: integer
 *           description: Cantidad de razas asociadas (incluyendo heredadas).
 *         globalModifierFormula:
 *           type: string
 *           description: |
 *             Fórmula del modificador de atributo (no es una fórmula de personaje).
 *             Ver AttributeModifierFormulaSyntax. Ejemplo: Math.floor((valor - 10) / 2).
 *         initiativeBonusFormula:
 *           type: string
 *           description: |
 *             Bono numérico de iniciativa (modificador), no la tirada completa.
 *             Ejemplo válido: `@attributes.dex.modifier`. No incluir `1d20`: la tirada la hace el frontend
 *             sumando PersonajeApi.initiativeBonus. Ver SystemCharacterFormulaSyntax.
 *         defaultMinAttributeValue:
 *           type: number
 *         defaultMaxAttributeValue:
 *           type: number
 *         creationMinAttributeValue:
 *           type: number
 *         creationMaxAttributeValue:
 *           type: number
 *         maxLevel:
 *           type: integer
 *           description: Nivel máximo del personaje en el sistema.
 *         maxSpellLevel:
 *           type: integer
 *           description: Nivel máximo de conjuro en el sistema.
 *         xpProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: Curva de experiencia acumulada por nivel (índice 0 = nivel 1).
 *         proficiencyProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: Bonificador de competencia por nivel total del personaje.
 *         abilityScoreProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: |
 *             Niveles de clase que otorgan Mejora de característica por defecto
 *             (p. ej. 4, 8, 12, 16, 19). Array vacío desactiva la mejora en este sistema.
 *             Una clase puede sustituir esta lista.
 *         hpInitialFormula:
 *           type: string
 *           description: |
 *             Fórmula de puntos de golpe iniciales (nivel 1). Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: max(@class.hitDie) + @attributes.con.modifier
 *         hpLevelUpFormula:
 *           type: string
 *           description: |
 *             Fórmula de puntos de golpe por subida de nivel. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @class.hitDie + @attributes.con.modifier
 *         baseAcFormula:
 *           type: string
 *           description: |
 *             Fórmula de clase de armadura base sin armadura equipada. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: 10 + @attributes.dex.modifier
 *         passiveSkillFormula:
 *           type: string
 *           description: |
 *             Plantilla de habilidades pasivas. Usa el placeholder {skillName}. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: 10 + @skills.{skillName}.totalModifier
 *         carryingCapacityFormula:
 *           type: string
 *           description: |
 *             Fórmula de capacidad de carga máxima del personaje. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @attributes.str.value * 15
 *         attackBonusFormula:
 *           type: string
 *           description: |
 *             Fórmula del bono de ataque con armas. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @weapon.attributeModifier + @weapon.isProficient * @proficiencyBonus + @weapon.isMagic
 *         damageBonusFormula:
 *           type: string
 *           description: |
 *             Fórmula del bono de daño con armas. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @weapon.attributeModifier + @weapon.isMagic
 *         meleeAttackAttributes:
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             Atributos base para armas cuerpo a cuerpo (ej. ["str"]). Se combinan con attackAttributes de las properties.
 *         rangedAttackAttributes:
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             Atributos base para armas a distancia (ej. ["dex"]). Se combinan con attackAttributes de las properties.
 *     SystemSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del sistema.
 *         name:
 *           type: string
 *           description: Nombre del sistema.
 *         description:
 *           type: string
 *           description: Descripción del sistema.
 *         publisher:
 *           type: string
 *           description: Nombre del publicador.
 *         isOpen:
 *           type: boolean
 *           description: Indica si el sistema es abierto/público.
 *         isBase:
 *           type: boolean
 *           description: |
 *             Indica si el sistema es un motor de juego. Todo sistema, y todo personaje, debe resolver
 *             a una única base más específica. Un sistema sin padres se trata siempre como base.
 *         kind:
 *           type: string
 *           enum: [ruleset, setting, campaign]
 *           description: |
 *             Tipo de sistema. `ruleset` aporta reglas y contenido. `setting` y `campaign` son capas de contenido
 *             que heredan las fórmulas del ruleset ancestro. Los documentos antiguos sin tipo se tratan como `ruleset`.
 *         parentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             Identificadores de los sistemas padre, en orden de prioridad entre hermanos.
 *             `setting` y `campaign` exigen al menos un padre. El orden se usa en la linealización C3.
 *         canEdit:
 *           type: boolean
 *           description: Indica si el usuario autenticado tiene permisos de edición.
 *         racesCount:
 *           type: integer
 *           description: Cantidad de razas raíz asociadas (incluyendo heredadas).
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico. En el listado de sistemas activos es `null`.
 *     TypeCrearSystem:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del sistema.
 *         description:
 *           type: string
 *           description: Descripción del sistema.
 *         isOpen:
 *           type: boolean
 *           description: Indica si es abierto.
 *         isBase:
 *           type: boolean
 *           description: |
 *             Indica si es un motor de juego. Solo permitido en `ruleset`. Un sistema sin padres
 *             se fuerza a `isBase: true`.
 *         kind:
 *           type: string
 *           enum: [ruleset, setting, campaign]
 *           default: ruleset
 *           description: |
 *             Tipo de sistema. `setting` y `campaign` exigen `parentIds` y no admiten fórmulas ni progresiones.
 *             `campaign` no puede ser padre de otro sistema.
 *         parentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             IDs de MongoDB de los sistemas padre, en orden de prioridad. Obligatorio para `setting` y `campaign`.
 *         globalModifierFormula:
 *           type: string
 *           description: |
 *             Fórmula del modificador de atributo. Ver AttributeModifierFormulaSyntax.
 *             Ejemplo: Math.floor((valor - 10) / 2).
 *         initiativeBonusFormula:
 *           type: string
 *           description: |
 *             Bono numérico de iniciativa (modificador), no la tirada completa.
 *             Ejemplo válido: `@attributes.dex.modifier`. No incluir `1d20`. Ver SystemCharacterFormulaSyntax.
 *         defaultMinAttributeValue:
 *           type: number
 *         defaultMaxAttributeValue:
 *           type: number
 *         creationMinAttributeValue:
 *           type: number
 *         creationMaxAttributeValue:
 *           type: number
 *         maxLevel:
 *           type: integer
 *           description: Nivel máximo del personaje en el sistema.
 *         maxSpellLevel:
 *           type: integer
 *           description: Nivel máximo de conjuro en el sistema.
 *         xpProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: Curva de experiencia acumulada por nivel (índice 0 = nivel 1). Debe coincidir con maxLevel.
 *         proficiencyProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: Bonificador de competencia por nivel total. Debe coincidir con maxLevel.
 *         abilityScoreProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: |
 *             Niveles de clase que otorgan Mejora de característica por defecto.
 *             No debe coincidir en longitud con maxLevel. Cada valor debe ser único,
 *             mayor o igual que 1 y no superar maxLevel. Array vacío desactiva la mejora.
 *         hpInitialFormula:
 *           type: string
 *           description: |
 *             Fórmula de PG nivel 1. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: max(@class.hitDie) + @attributes.con.modifier
 *         hpLevelUpFormula:
 *           type: string
 *           description: |
 *             Fórmula de PG por subida de nivel. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @class.hitDie + @attributes.con.modifier
 *         baseAcFormula:
 *           type: string
 *           description: |
 *             CA base sin armadura. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: 10 + @attributes.dex.modifier
 *         passiveSkillFormula:
 *           type: string
 *           description: |
 *             Plantilla de habilidades pasivas con {skillName}. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: 10 + @skills.{skillName}.totalModifier
 *         carryingCapacityFormula:
 *           type: string
 *           description: |
 *             Capacidad de carga. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @attributes.str.value * 15
 *         attackBonusFormula:
 *           type: string
 *           description: |
 *             Bono de ataque con armas. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @weapon.attributeModifier + @weapon.isProficient * @proficiencyBonus + @weapon.isMagic
 *         damageBonusFormula:
 *           type: string
 *           description: |
 *             Bono de daño con armas. Ver SystemCharacterFormulaSyntax.
 *             Ejemplo: @weapon.attributeModifier + @weapon.isMagic
 *         meleeAttackAttributes:
 *           type: array
 *           items:
 *             type: string
 *           description: Atributos base para armas cuerpo a cuerpo (ej. ["str"]).
 *         rangedAttackAttributes:
 *           type: array
 *           items:
 *             type: string
 *           description: Atributos base para armas a distancia (ej. ["dex"]).
 *     TypeModificarSystem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isOpen:
 *           type: boolean
 *         isBase:
 *           type: boolean
 *           description: |
 *             Motor de juego. Solo permitido en `ruleset`. No se puede desactivar en un sistema sin padres.
 *         kind:
 *           type: string
 *           enum: [ruleset, setting, campaign]
 *           description: |
 *             Tipo de sistema. Al pasar a `setting` o `campaign` hay que indicar `parentIds`
 *             y no se pueden enviar fórmulas ni progresiones.
 *         parentIds:
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             IDs de MongoDB de los sistemas padre. Obligatorio si `kind` es `setting` o `campaign`.
 *         globalModifierFormula:
 *           type: string
 *           description: |
 *             Fórmula del modificador de atributo. Ver AttributeModifierFormulaSyntax.
 *         initiativeBonusFormula:
 *           type: string
 *           description: |
 *             Bono numérico de iniciativa (modificador), no la tirada completa.
 *             Ejemplo válido: `@attributes.dex.modifier`. No incluir `1d20`. Ver SystemCharacterFormulaSyntax.
 *         defaultMinAttributeValue:
 *           type: number
 *         defaultMaxAttributeValue:
 *           type: number
 *         creationMinAttributeValue:
 *           type: number
 *         creationMaxAttributeValue:
 *           type: number
 *         maxLevel:
 *           type: integer
 *           description: Nivel máximo del personaje en el sistema.
 *         maxSpellLevel:
 *           type: integer
 *           description: Nivel máximo de conjuro en el sistema.
 *         xpProgression:
 *           type: array
 *           items:
 *             type: integer
 *         proficiencyProgression:
 *           type: array
 *           items:
 *             type: integer
 *         abilityScoreProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: Niveles de clase con Mejora de característica por defecto. Array vacío desactiva la mejora.
 *         hpInitialFormula:
 *           type: string
 *           description: Fórmula de PG nivel 1. Ver SystemCharacterFormulaSyntax.
 *         hpLevelUpFormula:
 *           type: string
 *           description: Fórmula de PG por subida de nivel. Ver SystemCharacterFormulaSyntax.
 *         baseAcFormula:
 *           type: string
 *           description: CA base sin armadura. Ver SystemCharacterFormulaSyntax.
 *         passiveSkillFormula:
 *           type: string
 *           description: Plantilla de habilidades pasivas con {skillName}. Ver SystemCharacterFormulaSyntax.
 *         carryingCapacityFormula:
 *           type: string
 *           description: Capacidad de carga. Ver SystemCharacterFormulaSyntax.
 *         attackBonusFormula:
 *           type: string
 *           description: Bono de ataque con armas. Ver SystemCharacterFormulaSyntax.
 *         damageBonusFormula:
 *           type: string
 *           description: Bono de daño con armas. Ver SystemCharacterFormulaSyntax.
 *         meleeAttackAttributes:
 *           type: array
 *           items:
 *             type: string
 *           description: Atributos base para armas cuerpo a cuerpo.
 *         rangedAttackAttributes:
 *           type: array
 *           items:
 *             type: string
 *           description: Atributos base para armas a distancia.
 */

/**
 * @openapi
 * /systems:
 *   get:
 *     summary: Obtener los sistemas accesibles por el usuario
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kind
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ruleset, setting, campaign]
 *         description: |
 *           Filtra por tipo de sistema. Si se omite, se devuelven los tres tipos
 *           (ruleset, setting y campaign) a los que el usuario ya tiene acceso.
 *     responses:
 *       200:
 *         description: Listado ligero de sistemas obtenidos exitosamente (sin catálogos ni fórmulas).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SystemSummary'
 *       400:
 *         description: El parámetro kind no es válido.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/systems', authMiddleware, validateQuery(ListSystemsQuerySchema), systemController.getSystems);

/**
 * @openapi
 * /systems:
 *   post:
 *     summary: Crear un nuevo sistema
 *     description: |
 *       `initiativeBonusFormula` define el **bono**, no la tirada. Para iniciativa total en la UI:
 *       `1d20 + personaje.initiativeBonus`. Valores como `1d20 + @attributes.dex.modifier` **no son válidos** al guardar el sistema.
 *
 *       Ejemplo de payload de referencia para D&D 5e (maxLevel 20):
 *       ```json
 *       {
 *         "name": "D&D 5e",
 *         "maxLevel": 20,
 *         "xpProgression": [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000],
 *         "proficiencyProgression": [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
 *         "abilityScoreProgression": [4, 8, 12, 16, 19],
 *         "hpInitialFormula": "max(@class.hitDie) + @attributes.con.modifier",
 *         "hpLevelUpFormula": "@class.hitDie + @attributes.con.modifier",
 *         "baseAcFormula": "10 + @attributes.dex.modifier",
 *         "passiveSkillFormula": "10 + @skills.{skillName}.totalModifier",
 *         "carryingCapacityFormula": "@attributes.str.value * 15",
 *         "initiativeBonusFormula": "@attributes.dex.modifier",
 *         "meleeAttackAttributes": ["str"],
 *         "rangedAttackAttributes": ["dex"],
 *         "attackBonusFormula": "@weapon.attributeModifier + @weapon.isProficient * @proficiencyBonus + @weapon.isMagic",
 *         "damageBonusFormula": "@weapon.attributeModifier + @weapon.isMagic"
 *       }
 *       ```
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeCrearSystem'
 *     responses:
 *       201:
 *         description: Sistema creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemSummary'
 *       400:
 *         description: Nombre de sistema es obligatorio.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/systems', authMiddleware, validateSchema(CreateSystemSchema), systemController.createSystem);

/**
 * @openapi
 * /systems/{id}:
 *   get:
 *     summary: Obtener el detalle completo de un sistema
 *     description: |
 *       Devuelve `SystemApi` (metadatos, fórmulas, progresiones y `racesCount`, incluyendo herencia de reglas).
 *       Características, habilidades y monedas se obtienen con `GET /attributes`, `GET /skills` y `GET /coins` filtrando por `ruleset`.
 *       El acceso sigue la misma regla que `GET /systems`: publicador, sistema abierto (`isOpen`)
 *       o identificador presente en `accessibleSystems` del usuario.
 *       Un `accessibleSystems` vacío no otorga acceso a todos los sistemas.
 *       Los sistemas borrados lógicamente responden 404.
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del sistema.
 *     responses:
 *       200:
 *         description: Detalle del sistema obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemApi'
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: El sistema existe pero el usuario no tiene acceso.
 *       404:
 *         description: Sistema no encontrado o borrado lógicamente.
 *       500:
 *         description: Error del servidor.
 */
router.get('/systems/:id', authMiddleware, systemController.getSystem);

/**
 * @openapi
 * /systems/{id}:
 *   put:
 *     summary: Modificar un sistema existente
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sistema.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeModificarSystem'
 *     responses:
 *       200:
 *         description: Sistema modificado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemSummary'
 *       400:
 *         description: Falta ID del sistema.
 *       403:
 *         description: No tienes permisos de edición o sistema no encontrado.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/systems/:id', authMiddleware, validateSchema(UpdateSystemSchema), systemController.updateSystem);

/**
 * @openapi
 * /systems/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un sistema
 *     description: |
 *       Borra el sistema y, en cascada, los hijos que se queden sin ningún padre activo.
 *       Si la cascada incluye sistemas de otros usuarios, no se borra nada y se responde 409.
 *       Los hijos que conservan otro padre vivo no se borran y mantienen el id eliminado en `parentIds`.
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sistema a borrar.
 *     responses:
 *       204:
 *         description: Sistema borrado exitosamente.
 *       400:
 *         description: ID de sistema requerido.
 *       403:
 *         description: No tienes permisos para borrar este sistema.
 *       404:
 *         description: Sistema no encontrado.
 *       409:
 *         description: La cascada incluiría sistemas de otros usuarios; no se ha borrado nada.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/systems/:id', authMiddleware, systemController.deleteSystem);

/**
 * @openapi
 * /systems/{id}/restore:
 *   patch:
 *     summary: Restaurar un sistema borrado lógicamente
 *     description: |
 *       Restaura el sistema y, de forma recursiva, los descendientes con el mismo `deletedAt`.
 *       Un sistema que no es base y no tiene ningún padre activo no se puede restaurar.
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sistema a restaurar.
 *     responses:
 *       200:
 *         description: Sistema restaurado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemSummary'
 *       400:
 *         description: ID de sistema requerido.
 *       403:
 *         description: No tienes permisos para restaurar este sistema.
 *       404:
 *         description: Sistema no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/systems/:id/restore', authMiddleware, systemController.restore);

export default router;
