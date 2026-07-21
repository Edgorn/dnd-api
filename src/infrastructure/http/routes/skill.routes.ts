import { Router } from "express";
import { skillController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateSkillSchema, UpdateSkillSchema } from "../schemas/skill.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Skill:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la habilidad.
 *         ruleset:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs o nombres de sistemas asociados.
 *         name:
 *           type: string
 *           description: Nombre de la habilidad.
 *         description:
 *           type: string
 *           description: Descripción detallada.
 *         key:
 *           type: string
 *           description: Clave identificadora única.
 *         bonusFormula:
 *           type: string
 *           description: Fórmula utilizada para calcular el modificador de la habilidad.
 *         attributeScore:
 *           type: array
 *           items:
 *             type: string
 *           description: Claves de atributos asociados.
 *     InputCreateSkill:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *         - key
 *         - bonusFormula
 *         - attributeScore
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema inicial desde el que se crea.
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         key:
 *           type: string
 *         bonusFormula:
 *           type: string
 *         attributeScore:
 *           type: array
 *           items:
 *             type: string
 *     InputUpdateSkill:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         key:
 *           type: string
 *         bonusFormula:
 *           type: string
 *         attributeScore:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @openapi
 * /skills:
 *   get:
 *     summary: Obtener habilidades filtradas por sistemas
 *     tags:
 *       - Habilidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema para filtrar habilidades (se heredan sistemas ancestros).
 *     responses:
 *       200:
 *         description: Lista de habilidades devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/skills', authMiddleware, skillController.obtenerTodas);

/**
 * @openapi
 * /skills:
 *   post:
 *     summary: Crear una nueva habilidad
 *     tags:
 *       - Habilidades
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateSkill'
 *     responses:
 *       201:
 *         description: Habilidad creada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Faltan campos obligatorios.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Ya existe una habilidad con esta clave en el sistema.
 *       500:
 *         description: Error del servidor.
 */
router.post('/skills', authMiddleware, validateSchema(CreateSkillSchema), skillController.create);

/**
 * @openapi
 * /skills/{id}:
 *   put:
 *     summary: Actualizar una habilidad existente
 *     tags:
 *       - Habilidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la habilidad a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateSkill'
 *     responses:
 *       200:
 *         description: Habilidad modificada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Falta el ID de la habilidad.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/skills/:id', authMiddleware, validateSchema(UpdateSkillSchema), skillController.update);

/**
 * @openapi
 * /skills/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de una habilidad
 *     tags:
 *       - Habilidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la habilidad a borrar.
 *     responses:
 *       204:
 *         description: Habilidad borrada exitosamente.
 *       400:
 *         description: ID de habilidad requerido.
 *       403:
 *         description: No tienes permisos para borrar esta habilidad.
 *       404:
 *         description: Habilidad no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/skills/:id', authMiddleware, skillController.delete);

/**
 * @openapi
 * /skills/{id}/restore:
 *   patch:
 *     summary: Restaurar una habilidad borrada lógicamente
 *     tags:
 *       - Habilidades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la habilidad a restaurar.
 *     responses:
 *       200:
 *         description: Habilidad restaurada exitosamente.
 *       400:
 *         description: ID de habilidad requerido.
 *       403:
 *         description: No tienes permisos para restaurar esta habilidad.
 *       404:
 *         description: Habilidad no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/skills/:id/restore', authMiddleware, skillController.restore);

export default router;
