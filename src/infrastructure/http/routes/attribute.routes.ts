import { Router } from "express";
import { attributeController, authMiddleware } from "../../dependencies";

import { validateSchema } from "../middlewares/validateSchema";
import { CreateAttributeSchema, UpdateAttributeSchema, AddSystemSchema } from "../schemas/attribute.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Attribute:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la característica.
 *         ruleset:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs o nombres de sistemas asociados.
 *         name:
 *           type: string
 *           description: Nombre de la característica (ej. Fuerza).
 *         description:
 *           type: string
 *           description: Descripción detallada.
 *         key:
 *           type: string
 *           description: Clave identificadora única (ej. str, dex).
 *         abbreviation:
 *           type: string
 *           description: Abreviatura (ej. FUE, DES).
 *         icon:
 *           type: string
 *           description: Nombre o URL del icono opcional.
 *     InputCreateAttribute:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *         - key
 *         - abbreviation
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema inicial desde el que se crea.
 *         name:
 *           type: string
 *           description: Nombre de la característica.
 *         description:
 *           type: string
 *           description: Descripción.
 *         key:
 *           type: string
 *           description: Clave identificadora única.
 *         abbreviation:
 *           type: string
 *           description: Abreviatura.
 *         icon:
 *           type: string
 *           description: Nombre o URL del icono opcional.
 *     InputUpdateAttribute:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         key:
 *           type: string
 *         abbreviation:
 *           type: string
 *         icon:
 *           type: string
 */

/**
 * @openapi
 * /attributes:
 *   post:
 *     summary: Crear una nueva característica
 *     tags:
 *       - Caracteristicas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateAttribute'
 *     responses:
 *       201:
 *         description: Característica creada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Faltan campos obligatorios.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Ya existe una característica con esta clave en el sistema.
 *       500:
 *         description: Error del servidor.
 */
router.post('/attributes', authMiddleware, validateSchema(CreateAttributeSchema), attributeController.create);

/**
 * @openapi
 * /attributes/{id}:
 *   put:
 *     summary: Actualizar una característica existente
 *     tags:
 *       - Caracteristicas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la característica a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateAttribute'
 *     responses:
 *       200:
 *         description: Característica modificada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       400:
 *         description: Falta el ID de la característica.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró la característica.
 *       500:
 *         description: Error del servidor.
 */
router.put('/attributes/:id', authMiddleware, validateSchema(UpdateAttributeSchema), attributeController.update);

/**
 * @openapi
 * /attributes/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de una característica
 *     tags:
 *       - Caracteristicas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la característica a borrar.
 *     responses:
 *       204:
 *         description: Característica borrada exitosamente.
 *       400:
 *         description: ID de característica requerido.
 *       403:
 *         description: No tienes permisos para borrar esta característica.
 *       404:
 *         description: Característica no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/attributes/:id', authMiddleware, attributeController.delete);

/**
 * @openapi
 * /attributes/{id}/restore:
 *   patch:
 *     summary: Restaurar una característica borrada lógicamente
 *     tags:
 *       - Caracteristicas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la característica a restaurar.
 *     responses:
 *       200:
 *         description: Característica restaurada exitosamente.
 *       400:
 *         description: ID de característica requerido.
 *       403:
 *         description: No tienes permisos para restaurar esta característica.
 *       404:
 *         description: Característica no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/attributes/:id/restore', authMiddleware, attributeController.restore);

export default router;
