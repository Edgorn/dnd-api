import { Router } from "express";
import { optionGroupController, authMiddleware } from "../../dependencies";
import { validateParams, validateSchema } from "../middlewares/validateSchema";
import {
  CreateGroupOptionSchema,
  CreateOptionGroupSchema,
  OptionGroupIdParamsSchema,
  OptionGroupOptionsParamsSchema,
  UpdateGroupOptionSchema,
  UpdateOptionGroupSchema
} from "../schemas/optionGroup.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Prerequisite:
 *       description: >
 *         Unión discriminada de requisitos para elegir una opción de grupo.
 *         Se combina con `all` (todos) o `any` (al menos uno). Sin classId en classLevel
 *         se usa la clase que concede la elección en el level-up.
 *       oneOf:
 *         - $ref: '#/components/schemas/PrerequisiteClassLevel'
 *         - $ref: '#/components/schemas/PrerequisiteCharacterLevel'
 *         - $ref: '#/components/schemas/PrerequisiteTrait'
 *         - $ref: '#/components/schemas/PrerequisiteSpell'
 *         - $ref: '#/components/schemas/PrerequisiteAttribute'
 *         - $ref: '#/components/schemas/PrerequisiteAll'
 *         - $ref: '#/components/schemas/PrerequisiteAny'
 *     PrerequisiteClassLevel:
 *       type: object
 *       required:
 *         - type
 *         - min
 *       properties:
 *         type:
 *           type: string
 *           enum: [classLevel]
 *         classId:
 *           type: string
 *           description: ObjectId de la clase. Si se omite, es la clase que concede la elección.
 *         min:
 *           type: integer
 *           minimum: 1
 *           description: Nivel mínimo de esa clase.
 *     PrerequisiteCharacterLevel:
 *       type: object
 *       required:
 *         - type
 *         - min
 *       properties:
 *         type:
 *           type: string
 *           enum: [characterLevel]
 *         min:
 *           type: integer
 *           minimum: 1
 *           description: Nivel total mínimo del personaje.
 *     PrerequisiteTrait:
 *       type: object
 *       required:
 *         - type
 *         - traitId
 *       properties:
 *         type:
 *           type: string
 *           enum: [trait]
 *         traitId:
 *           type: string
 *           description: ObjectId del rasgo requerido (p. ej. un pacto).
 *     PrerequisiteSpell:
 *       type: object
 *       required:
 *         - type
 *         - spellId
 *       properties:
 *         type:
 *           type: string
 *           enum: [spell]
 *         spellId:
 *           type: string
 *           description: ObjectId de un conjuro conocido o extra.
 *     PrerequisiteAttribute:
 *       type: object
 *       required:
 *         - type
 *         - key
 *         - min
 *       properties:
 *         type:
 *           type: string
 *           enum: [attribute]
 *         key:
 *           type: string
 *           description: Clave de característica del sistema (p. ej. cha), no el ObjectId.
 *         min:
 *           type: number
 *           description: Valor mínimo de esa característica.
 *     PrerequisiteAll:
 *       type: object
 *       required:
 *         - all
 *       properties:
 *         all:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/Prerequisite'
 *     PrerequisiteAny:
 *       type: object
 *       required:
 *         - any
 *       properties:
 *         any:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/Prerequisite'
 *     OptionChoiceMongo:
 *       type: object
 *       required:
 *         - groupId
 *         - choose
 *       properties:
 *         groupId:
 *           type: string
 *           description: ObjectId del grupo de opciones.
 *         choose:
 *           type: integer
 *           minimum: 0
 *           description: Número de opciones nuevas que hay que elegir en este nivel.
 *         replace:
 *           type: integer
 *           minimum: 0
 *           description: Número máximo de opciones ya elegidas que se pueden recambiar. Opcional.
 *       description: >
 *         Concesión de un grupo en un nivel de clase o subclase. Debe tener choose o replace
 *         mayor que 0. En update, null en el array del nivel borra las concesiones de ese nivel.
 *     OptionReplacementConfig:
 *       type: object
 *       required:
 *         - groupId
 *         - count
 *       properties:
 *         groupId:
 *           type: string
 *           description: ObjectId del grupo de opciones.
 *         count:
 *           type: integer
 *           minimum: 1
 *           description: Máximo de opciones ya elegidas de este grupo que se pueden recambiar al ganar un nivel de la clase.
 *       description: >
 *         Política de recambio por grupo, a nivel de clase o subclase. Se ofrece en cada
 *         subida de esa clase cuando el personaje ya tiene alguna opción de ese grupo.
 *         No sustituye a `choose` de cada nivel; se fusiona con `optionChoices.replace`.
 *     OptionGroup:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del grupo.
 *         ruleset:
 *           type: string
 *           description: Sistema al que pertenece el grupo. Sin classId; varias clases pueden usarlo.
 *         name:
 *           type: string
 *           description: Nombre del grupo (p. ej. Invocaciones sobrenaturales).
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción del grupo.
 *     GroupOption:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         ruleset:
 *           type: string
 *         groupId:
 *           type: string
 *           description: ID del grupo al que pertenece la opción.
 *         traitId:
 *           type: string
 *           description: ID del rasgo efecto que se aplica al elegir la opción.
 *         trait:
 *           $ref: '#/components/schemas/Trait'
 *         prerequisites:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Prerequisite'
 *           description: Requisitos para elegir la opción. Null o omitido = sin requisitos.
 *         repeatable:
 *           type: boolean
 *           description: Si es true, se puede elegir más de una vez.
 *     PendingOptionChoiceOption:
 *       allOf:
 *         - $ref: '#/components/schemas/GroupOption'
 *         - type: object
 *           properties:
 *             available:
 *               type: boolean
 *               description: True si el personaje cumple los requisitos.
 *             unmet:
 *               type: boolean
 *               description: True si no cumple los requisitos.
 *     InputCreateOptionGroup:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *       properties:
 *         ruleset:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *     InputUpdateOptionGroup:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *     InputCreateGroupOption:
 *       type: object
 *       required:
 *         - ruleset
 *         - groupId
 *         - traitId
 *       properties:
 *         ruleset:
 *           type: string
 *         groupId:
 *           type: string
 *         traitId:
 *           type: string
 *           description: ObjectId del rasgo efecto de la opción.
 *         prerequisites:
 *           $ref: '#/components/schemas/Prerequisite'
 *         repeatable:
 *           type: boolean
 *     InputUpdateGroupOption:
 *       type: object
 *       properties:
 *         groupId:
 *           type: string
 *         traitId:
 *           type: string
 *         prerequisites:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Prerequisite'
 *           description: Null borra los requisitos.
 *         repeatable:
 *           type: boolean
 */

/**
 * @openapi
 * /option-groups:
 *   get:
 *     summary: Obtener grupos de opciones filtrados por sistemas
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID del sistema. Incluye grupos de ancestros; si padre e hijo comparten el mismo nombre, gana el más específico.
 *     responses:
 *       200:
 *         description: Lista de grupos de opciones.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OptionGroup'
 */
router.get("/option-groups", authMiddleware, optionGroupController.getBySystems);

/**
 * @openapi
 * /option-groups:
 *   post:
 *     summary: Crear un grupo de opciones
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateOptionGroup'
 *     responses:
 *       201:
 *         description: Grupo creado con éxito.
 */
router.post("/option-groups", authMiddleware, validateSchema(CreateOptionGroupSchema), optionGroupController.create);

/**
 * @openapi
 * /option-groups/{id}:
 *   put:
 *     summary: Actualizar un grupo de opciones
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateOptionGroup'
 *     responses:
 *       200:
 *         description: Grupo actualizado.
 */
router.put("/option-groups/:id", authMiddleware, validateParams(OptionGroupIdParamsSchema), validateSchema(UpdateOptionGroupSchema), optionGroupController.update);

/**
 * @openapi
 * /option-groups/{id}:
 *   delete:
 *     summary: Borrado lógico de un grupo de opciones
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Grupo borrado.
 */
router.delete("/option-groups/:id", authMiddleware, validateParams(OptionGroupIdParamsSchema), optionGroupController.delete);

/**
 * @openapi
 * /option-groups/{id}/restore:
 *   patch:
 *     summary: Restaurar un grupo de opciones
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grupo restaurado.
 */
router.patch("/option-groups/:id/restore", authMiddleware, validateParams(OptionGroupIdParamsSchema), optionGroupController.restore);

/**
 * @openapi
 * /option-groups/{groupId}/options:
 *   get:
 *     summary: Listar opciones de un grupo
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: Sistema del personaje. Incluye opciones de sistemas ancestros.
 *     responses:
 *       200:
 *         description: Lista de opciones del grupo.
 */
router.get("/option-groups/:groupId/options", authMiddleware, validateParams(OptionGroupOptionsParamsSchema), optionGroupController.getOptions);

/**
 * @openapi
 * /group-options:
 *   post:
 *     summary: Crear una opción de un grupo
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateGroupOption'
 *     responses:
 *       201:
 *         description: Opción creada.
 */
router.post("/group-options", authMiddleware, validateSchema(CreateGroupOptionSchema), optionGroupController.createOption);

/**
 * @openapi
 * /group-options/{id}:
 *   put:
 *     summary: Actualizar una opción de grupo
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateGroupOption'
 *     responses:
 *       200:
 *         description: Opción actualizada.
 */
router.put("/group-options/:id", authMiddleware, validateParams(OptionGroupIdParamsSchema), validateSchema(UpdateGroupOptionSchema), optionGroupController.updateOption);

/**
 * @openapi
 * /group-options/{id}:
 *   delete:
 *     summary: Borrado lógico de una opción de grupo
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Opción borrada.
 */
router.delete("/group-options/:id", authMiddleware, validateParams(OptionGroupIdParamsSchema), optionGroupController.deleteOption);

/**
 * @openapi
 * /group-options/{id}/restore:
 *   patch:
 *     summary: Restaurar una opción de grupo
 *     tags:
 *       - Grupos de opciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opción restaurada.
 */
router.patch("/group-options/:id/restore", authMiddleware, validateParams(OptionGroupIdParamsSchema), optionGroupController.restoreOption);

export default router;
