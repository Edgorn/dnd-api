import { Router } from "express";
import { skillController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateSkillSchema, UpdateSkillSchema, AddSystemSchema } from "../schemas/skill.schema";

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
 * /skills/{id}/systems:
 *   post:
 *     summary: Asociar habilidad a un sistema (a través del cuerpo)
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
 *         description: ID de la habilidad.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - systemId
 *             properties:
 *               systemId:
 *                 type: string
 *                 description: ID o nombre del sistema a añadir.
 *     responses:
 *       200:
 *         description: Sistema asociado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Faltan campos obligatorios.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/skills/:id/systems', authMiddleware, validateSchema(AddSystemSchema), skillController.addSystem);

/**
 * @openapi
 * /skills/{id}/systems/{systemId}:
 *   delete:
 *     summary: Desasociar habilidad de un sistema (a través de URL)
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
 *         description: ID de la habilidad.
 *       - in: path
 *         name: systemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema a eliminar.
 *     responses:
 *       200:
 *         description: Sistema desasociado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       400:
 *         description: Faltan parámetros obligatorios.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/skills/:id/systems/:systemId', authMiddleware, skillController.removeSystem);

export default router;
