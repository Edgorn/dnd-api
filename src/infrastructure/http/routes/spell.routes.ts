import { Router } from "express";
import { spellController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateSpellSchema, UpdateSpellSchema } from "../schemas/spell.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Spell:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del conjuro.
 *         ruleset:
 *           type: string
 *           description: Sistema al que pertenece el conjuro.
 *         name:
 *           type: string
 *           description: Nombre del conjuro (ej. Flecha Ácida).
 *         type:
 *           type: string
 *         level:
 *           type: number
 *           description: Nivel del conjuro (0 a 9).
 *         classes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs de las clases que pueden aprender el conjuro.
 *         typeName:
 *           type: string
 *         school:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             color:
 *               type: string
 *           description: Escuela de magia asociada.
 *         castingTime:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             condition:
 *               type: string
 *           description: Tiempo de lanzamiento detallado.
 *         range:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             area:
 *               type: object
 *               properties:
 *                 shape:
 *                   type: string
 *                 value:
 *                   type: number
 *                 unit:
 *                   type: string
 *           description: Alcance detallado del conjuro.
 *         components:
 *           type: object
 *           properties:
 *             verbal:
 *               type: boolean
 *             somatic:
 *               type: boolean
 *             material:
 *               type: boolean
 *             materialsDescription:
 *               type: string
 *           description: Componentes requeridos (V, S, M) y descripción de materiales.
 *         duration:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             concentration:
 *               type: boolean
 *           description: Duración detallada del conjuro.
 *         damage:
 *           type: object
 *           properties:
 *             base:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   diceCount:
 *                     type: number
 *                   diceType:
 *                     type: string
 *                   type:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       color:
 *                         type: string
 *             scaling:
 *               type: object
 *               properties:
 *                 mode:
 *                   type: string
 *                   enum: [per_slot_level, character_level]
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [add, override]
 *                       components:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             diceCount:
 *                               type: number
 *                             diceType:
 *                               type: string
 *                             type:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 description:
 *                                   type: string
 *                                 color:
 *                                   type: string
 *           description: Información de daño del conjuro.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción del conjuro dividida en párrafos.
 *         ritual:
 *           type: boolean
 *           description: Indica si el conjuro puede lanzarse como ritual.
 *     InputCreateSpell:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - level
 *         - description
 *       properties:
 *         ruleset:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         level:
 *           type: number
 *         classes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs de las clases.
 *         school:
 *           type: string
 *           description: ID de la escuela de magia.
 *         castingTime:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             condition:
 *               type: string
 *         range:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             area:
 *               type: object
 *               properties:
 *                 shape:
 *                   type: string
 *                 value:
 *                   type: number
 *                 unit:
 *                   type: string
 *         components:
 *           type: object
 *           properties:
 *             verbal:
 *               type: boolean
 *             somatic:
 *               type: boolean
 *             material:
 *               type: boolean
 *             materialsDescription:
 *               type: string
 *         duration:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             concentration:
 *               type: boolean
 *         damage:
 *           type: object
 *           properties:
 *             base:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   diceCount:
 *                     type: number
 *                   diceType:
 *                     type: string
 *                   type:
 *                     type: string
 *                     description: ID del tipo de daño.
 *             scaling:
 *               type: object
 *               properties:
 *                 mode:
 *                   type: string
 *                   enum: [per_slot_level, character_level]
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [add, override]
 *                       components:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             diceCount:
 *                               type: number
 *                             diceType:
 *                               type: string
 *                             type:
 *                               type: string
 *                               description: ID del tipo de daño.
 *     InputUpdateSpell:
 *       type: object
 *       properties:
 *         ruleset:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         level:
 *           type: number
 *         classes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs de las clases.
 *         school:
 *           type: string
 *           description: ID de la escuela de magia.
 *         castingTime:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             condition:
 *               type: string
 *         range:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             area:
 *               type: object
 *               properties:
 *                 shape:
 *                   type: string
 *                 value:
 *                   type: number
 *                 unit:
 *                   type: string
 *         components:
 *           type: object
 *           properties:
 *             verbal:
 *               type: boolean
 *             somatic:
 *               type: boolean
 *             material:
 *               type: boolean
 *             materialsDescription:
 *               type: string
 *         duration:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             value:
 *               type: number
 *             unit:
 *               type: string
 *             concentration:
 *               type: boolean
 *         damage:
 *           type: object
 *           properties:
 *             base:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   diceCount:
 *                     type: number
 *                   diceType:
 *                     type: string
 *                   type:
 *                     type: string
 *                     description: ID del tipo de daño.
 *             scaling:
 *               type: object
 *               properties:
 *                 mode:
 *                   type: string
 *                   enum: [per_slot_level, character_level]
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [add, override]
 *                       components:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             diceCount:
 *                               type: number
 *                             diceType:
 *                               type: string
 *                             type:
 *                               type: string
 *                               description: ID del tipo de daño.
 */

/**
 * @openapi
 * /spells:
 *   get:
 *     summary: Obtener conjuros filtrados por sistemas
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema para filtrar conjuros (se heredan sistemas ancestros).
 *     responses:
 *       200:
 *         description: Lista de conjuros devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Spell'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/spells', authMiddleware, spellController.getSpellsBySystems);

/**
 * @openapi
 * /spells/rituals:
 *   get:
 *     summary: Obtener conjuros de tipo ritual
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema para filtrar.
 *     responses:
 *       200:
 *         description: Lista de conjuros rituales devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Spell'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/spells/rituals', authMiddleware, spellController.getRitualSpells);

/**
 * @openapi
 * /spells/level/{level}:
 *   get:
 *     summary: Obtener conjuros filtrados por nivel y opcionalmente clase
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: integer
 *         description: Nivel del conjuro.
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema.
 *       - in: query
 *         name: className
 *         schema:
 *           type: string
 *         description: Nombre de la clase (ej. wizard, cleric).
 *     responses:
 *       200:
 *         description: Lista de conjuros devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Spell'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/spells/level/:level', authMiddleware, spellController.getSpellsByLevel);

/**
 * @openapi
 * /spells/{id}:
 *   get:
 *     summary: Obtener un conjuro por su ID
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del conjuro.
 *     responses:
 *       200:
 *         description: Conjuro encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Spell'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Conjuro no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/spells/:id', authMiddleware, spellController.getById);

/**
 * @openapi
 * /spells:
 *   post:
 *     summary: Crear un nuevo conjuro
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateSpell'
 *     responses:
 *       201:
 *         description: Conjuro creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Spell'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Ya existe un conjuro con ese índice en el sistema.
 *       500:
 *         description: Error del servidor.
 */
router.post('/spells', authMiddleware, validateSchema(CreateSpellSchema), spellController.create);

/**
 * @openapi
 * /spells/{id}:
 *   put:
 *     summary: Actualizar un conjuro existente
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del conjuro a modificar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateSpell'
 *     responses:
 *       200:
 *         description: Conjuro actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Spell'
 *       400:
 *         description: ID de conjuro requerido o datos inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Conjuro no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/spells/:id', authMiddleware, validateSchema(UpdateSpellSchema), spellController.update);

/**
 * @openapi
 * /spells/{id}:
 *   delete:
 *     summary: Realizar borrado lógico de un conjuro
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del conjuro a eliminar.
 *     responses:
 *       204:
 *         description: Conjuro eliminado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para eliminar en este sistema.
 *       404:
 *         description: Conjuro no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/spells/:id', authMiddleware, spellController.delete);

/**
 * @openapi
 * /spells/{id}/restore:
 *   patch:
 *     summary: Restaurar un conjuro borrado lógicamente
 *     tags:
 *       - Conjuros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del conjuro a restaurar.
 *     responses:
 *       200:
 *         description: Conjuro restaurado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para restaurar en este sistema.
 *       404:
 *         description: Conjuro no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/spells/:id/restore', authMiddleware, spellController.restore);

export default router;
