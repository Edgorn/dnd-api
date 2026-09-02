import { Router } from "express";
import { systemController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateSystemSchema, UpdateSystemSchema } from "../schemas/system.schema";

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
 *           description: Indica si el sistema es una plantilla base (reglas únicamente).
 *         parentId:
 *           type: string
 *           description: ID del sistema del que hereda (si lo tiene).
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
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attribute'
 *           description: Características vinculadas a este sistema (incluyendo heredadas).
 *         skills:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Skill'
 *           description: Habilidades vinculadas a este sistema (incluyendo heredadas).
 *         coins:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Coin'
 *           description: Monedas vinculadas a este sistema (incluyendo heredadas).
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
 *           description: Indica si es una plantilla base.
 *         parentId:
 *           type: string
 *           description: ID de MongoDB del sistema padre.
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
 *         parentId:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Listado de sistemas obtenidos exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SystemApi'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/systems', authMiddleware, systemController.getSystems);

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
 *               $ref: '#/components/schemas/SystemApi'
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
 *               $ref: '#/components/schemas/SystemApi'
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
 *       500:
 *         description: Error del servidor.
 */
router.delete('/systems/:id', authMiddleware, systemController.deleteSystem);

/**
 * @openapi
 * /systems/{id}/restore:
 *   patch:
 *     summary: Restaurar un sistema borrado lógicamente
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
