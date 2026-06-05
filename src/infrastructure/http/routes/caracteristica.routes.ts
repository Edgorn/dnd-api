import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { caracteristicaController } from "../../dependencies";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Caracteristica:
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
 *           description: Nombre de la característica (e.g. Fuerza).
 *         description:
 *           type: string
 *           description: Descripción detallada.
 *         key:
 *           type: string
 *           description: Clave única identificadora (e.g. str, dex).
 *         abbreviation:
 *           type: string
 *           description: Abreviación (e.g. FUE, DES).
 *     InputCrearCaracteristica:
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
 *           description: Abreviación.
 *     InputModificarCaracteristica:
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
 */

/**
 * @openapi
 * /caracteristicas:
 *   post:
 *     summary: Crear una nueva característica
 *     tags:
 *       - Características
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCrearCaracteristica'
 *     responses:
 *       201:
 *         description: Característica creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caracteristica'
 *       400:
 *         description: Faltan campos requeridos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/caracteristicas', authMiddleware, caracteristicaController.create);

/**
 * @openapi
 * /caracteristicas/{id}:
 *   put:
 *     summary: Modificar una característica existente
 *     tags:
 *       - Características
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
 *             $ref: '#/components/schemas/InputModificarCaracteristica'
 *     responses:
 *       200:
 *         description: Característica modificada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caracteristica'
 *       400:
 *         description: Falta ID de característica.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/caracteristicas/:id', authMiddleware, caracteristicaController.update);

/**
 * @openapi
 * /caracteristicas/{id}/sistemas:
 *   post:
 *     summary: Asociar característica a un sistema (mediante body)
 *     tags:
 *       - Características
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la característica.
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
 *         description: Sistema asociado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caracteristica'
 *       400:
 *         description: Faltan campos requeridos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/caracteristicas/:id/sistemas', authMiddleware, caracteristicaController.addSystem);

/**
 * @openapi
 * /caracteristicas/{id}/sistemas/{systemId}:
 *   post:
 *     summary: Asociar característica a un sistema (mediante URL)
 *     tags:
 *       - Características
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la característica.
 *       - in: path
 *         name: systemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema a añadir.
 *     responses:
 *       200:
 *         description: Sistema asociado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caracteristica'
 *       400:
 *         description: Faltan parámetros requeridos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/caracteristicas/:id/sistemas/:systemId', authMiddleware, caracteristicaController.addSystem);

/**
 * @openapi
 * /caracteristicas/{id}/sistemas:
 *   delete:
 *     summary: Desasociar característica de un sistema (mediante body)
 *     tags:
 *       - Características
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la característica.
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
 *                 description: ID o nombre del sistema a remover.
 *     responses:
 *       200:
 *         description: Sistema desasociado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caracteristica'
 *       400:
 *         description: Faltan campos requeridos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/caracteristicas/:id/sistemas', authMiddleware, caracteristicaController.removeSystem);

/**
 * @openapi
 * /caracteristicas/{id}/sistemas/{systemId}:
 *   delete:
 *     summary: Desasociar característica de un sistema (mediante URL)
 *     tags:
 *       - Características
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la característica.
 *       - in: path
 *         name: systemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema a remover.
 *     responses:
 *       200:
 *         description: Sistema desasociado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Caracteristica'
 *       400:
 *         description: Faltan parámetros requeridos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/caracteristicas/:id/sistemas/:systemId', authMiddleware, caracteristicaController.removeSystem);

export default router;
