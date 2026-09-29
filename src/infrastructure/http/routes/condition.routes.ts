import { Router } from "express";
import { conditionController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { createConditionSchema, updateConditionSchema } from "../schemas/condition.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Condition:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del estado.
 *         name:
 *           type: string
 *           description: Nombre del estado (ej. Envenenado, Aturdido).
 *         description:
 *           type: string
 *           description: Descripción del estado.
 *         ruleset:
 *           type: string
 *           description: ID del sistema al que pertenece.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico. Solo visible para el publicador del sistema.
 *     InputCreateCondition:
 *       type: object
 *       required:
 *         - name
 *         - ruleset
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del estado.
 *         description:
 *           type: string
 *           description: Descripción opcional.
 *         ruleset:
 *           type: string
 *           description: ID del sistema de reglas.
 *     InputUpdateCondition:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del estado.
 *         description:
 *           type: string
 *           description: Descripción.
 *         ruleset:
 *           type: string
 *           description: ID del sistema de reglas.
 */

/**
 * @openapi
 * /conditions:
 *   get:
 *     summary: Obtener los estados asociados a ciertos sistemas
 *     tags:
 *       - Estados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         required: false
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Sistema o sistemas para filtrar los estados. Incluye los sistemas ancestros.
 *     responses:
 *       200:
 *         description: Lista de estados obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Condition'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/conditions", authMiddleware, conditionController.getBySystems);

/**
 * @openapi
 * /conditions:
 *   post:
 *     summary: Crear un nuevo estado
 *     tags:
 *       - Estados
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateCondition'
 *     responses:
 *       201:
 *         description: Estado creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Condition'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para crear estados en este sistema.
 *       404:
 *         description: Sistema asociado no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/conditions", authMiddleware, validateSchema(createConditionSchema), conditionController.create);

/**
 * @openapi
 * /conditions/{id}:
 *   put:
 *     summary: Actualizar un estado existente
 *     tags:
 *       - Estados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estado a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateCondition'
 *     responses:
 *       200:
 *         description: Estado actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Condition'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para editar este estado.
 *       404:
 *         description: Estado o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put("/conditions/:id", authMiddleware, validateSchema(updateConditionSchema), conditionController.update);

/**
 * @openapi
 * /conditions/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un estado
 *     tags:
 *       - Estados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estado a borrar.
 *     responses:
 *       204:
 *         description: Estado borrado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para borrar este estado.
 *       404:
 *         description: Estado o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete("/conditions/:id", authMiddleware, conditionController.delete);

/**
 * @openapi
 * /conditions/{id}/restore:
 *   patch:
 *     summary: Restaurar un estado borrado lógicamente
 *     tags:
 *       - Estados
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estado a restaurar.
 *     responses:
 *       200:
 *         description: Estado restaurado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para restaurar este estado.
 *       404:
 *         description: Estado o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/conditions/:id/restore", authMiddleware, conditionController.restore);

export default router;
