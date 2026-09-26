import { Router } from "express";
import { creatureTypeController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { createCreatureTypeSchema, updateCreatureTypeSchema } from "../schemas/creatureType.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CreatureType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del tipo de criatura.
 *         name:
 *           type: string
 *           description: Nombre del tipo (ej. Humanoide, Bestia).
 *         description:
 *           type: string
 *           description: Descripción del tipo de criatura.
 *         ruleset:
 *           type: string
 *           description: ID del sistema al que pertenece.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico. Solo visible para el publicador del sistema.
 *     InputCreateCreatureType:
 *       type: object
 *       required:
 *         - name
 *         - ruleset
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del tipo de criatura.
 *         description:
 *           type: string
 *           description: Descripción opcional.
 *         ruleset:
 *           type: string
 *           description: ID del sistema de reglas.
 *     InputUpdateCreatureType:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del tipo de criatura.
 *         description:
 *           type: string
 *           description: Descripción.
 *         ruleset:
 *           type: string
 *           description: ID del sistema de reglas.
 */

/**
 * @openapi
 * /creature-types:
 *   get:
 *     summary: Obtener los tipos de criatura asociados a ciertos sistemas
 *     tags:
 *       - Tipos de criatura
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
 *         description: Sistema o sistemas para filtrar los tipos. Incluye los sistemas ancestros.
 *     responses:
 *       200:
 *         description: Lista de tipos de criatura obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreatureType'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/creature-types", authMiddleware, creatureTypeController.getBySystems);

/**
 * @openapi
 * /creature-types:
 *   post:
 *     summary: Crear un nuevo tipo de criatura
 *     tags:
 *       - Tipos de criatura
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateCreatureType'
 *     responses:
 *       201:
 *         description: Tipo de criatura creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatureType'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para crear tipos en este sistema.
 *       404:
 *         description: Sistema asociado no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/creature-types", authMiddleware, validateSchema(createCreatureTypeSchema), creatureTypeController.create);

/**
 * @openapi
 * /creature-types/{id}:
 *   put:
 *     summary: Actualizar un tipo de criatura existente
 *     tags:
 *       - Tipos de criatura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de criatura a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateCreatureType'
 *     responses:
 *       200:
 *         description: Tipo de criatura actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatureType'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para editar este tipo de criatura.
 *       404:
 *         description: Tipo de criatura o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put("/creature-types/:id", authMiddleware, validateSchema(updateCreatureTypeSchema), creatureTypeController.update);

/**
 * @openapi
 * /creature-types/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un tipo de criatura
 *     tags:
 *       - Tipos de criatura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de criatura a borrar.
 *     responses:
 *       204:
 *         description: Tipo de criatura borrado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para borrar este tipo de criatura.
 *       404:
 *         description: Tipo de criatura o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete("/creature-types/:id", authMiddleware, creatureTypeController.delete);

/**
 * @openapi
 * /creature-types/{id}/restore:
 *   patch:
 *     summary: Restaurar un tipo de criatura borrado lógicamente
 *     tags:
 *       - Tipos de criatura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de criatura a restaurar.
 *     responses:
 *       200:
 *         description: Tipo de criatura restaurado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para restaurar este tipo de criatura.
 *       404:
 *         description: Tipo de criatura o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/creature-types/:id/restore", authMiddleware, creatureTypeController.restore);

export default router;
