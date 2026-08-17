import { Router } from "express";
import { coinController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateCoinSchema, UpdateCoinSchema } from "../schemas/coin.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Coin:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la moneda autogenerado por MongoDB.
 *         ruleset:
 *           type: string
 *           description: Sistema de juego al que pertenece la moneda.
 *         name:
 *           type: string
 *           description: Nombre de la moneda (ej. Pieza de Oro, Pieza de Plata).
 *         abbreviation:
 *           type: string
 *           description: Abreviatura de la moneda (ej. po, pp, pc).
 *         isBase:
 *           type: boolean
 *           description: Indica si es la moneda base de referencia del sistema.
 *         multiplier:
 *           type: number
 *           description: Multiplicador o valor relativo respecto a la moneda base.
 *         weight:
 *           type: number
 *           description: Peso de una sola moneda.
 *         color:
 *           type: string
 *           description: Color identificativo de la moneda (ej. código hexadecimal o nombre).
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico, o null si está activa.
 *     InputCreateCoin:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - abbreviation
 *         - multiplier
 *         - weight
 *         - color
 *       properties:
 *         ruleset:
 *           type: string
 *           description: Sistema de juego al que pertenecerá la moneda.
 *         name:
 *           type: string
 *           description: Nombre de la moneda.
 *         abbreviation:
 *           type: string
 *           description: Abreviatura de la moneda.
 *         isBase:
 *           type: boolean
 *           description: Indica si es la moneda base de referencia.
 *         multiplier:
 *           type: number
 *           description: Multiplicador relativo de valor.
 *         weight:
 *           type: number
 *           description: Peso de una sola moneda.
 *         color:
 *           type: string
 *           description: Color identificativo de la moneda (ej. #FFD700).
 *     InputUpdateCoin:
 *       type: object
 *       properties:
 *         ruleset:
 *           type: string
 *         name:
 *           type: string
 *         abbreviation:
 *           type: string
 *         isBase:
 *           type: boolean
 *         multiplier:
 *           type: number
 *         weight:
 *           type: number
 *         color:
 *           type: string
 *           description: Color identificativo de la moneda.
 */

/**
 * @openapi
 * /coins:
 *   get:
 *     summary: Obtener monedas filtradas por sistemas
 *     tags:
 *       - Monedas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o clave del sistema para filtrar monedas (incluye herencia de ancestros).
 *     responses:
 *       200:
 *         description: Lista de monedas devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coin'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/coins', authMiddleware, coinController.getCoins);

/**
 * @openapi
 * /coins/{id}:
 *   get:
 *     summary: Obtener una moneda por su ID
 *     tags:
 *       - Monedas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la moneda a consultar.
 *     responses:
 *       200:
 *         description: Moneda encontrada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coin'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Moneda no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/coins/:id', authMiddleware, coinController.getById);

/**
 * @openapi
 * /coins:
 *   post:
 *     summary: Crear una nueva moneda
 *     tags:
 *       - Monedas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateCoin'
 *     responses:
 *       201:
 *         description: Moneda creada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coin'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/coins', authMiddleware, validateSchema(CreateCoinSchema), coinController.create);

/**
 * @openapi
 * /coins/{id}:
 *   put:
 *     summary: Actualizar una moneda existente
 *     tags:
 *       - Monedas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la moneda a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateCoin'
 *     responses:
 *       200:
 *         description: Moneda modificada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coin'
 *       400:
 *         description: Petición incorrecta o datos inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Moneda no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/coins/:id', authMiddleware, validateSchema(UpdateCoinSchema), coinController.update);

/**
 * @openapi
 * /coins/{id}:
 *   delete:
 *     summary: Eliminar una moneda (borrado lógico)
 *     tags:
 *       - Monedas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la moneda a eliminar.
 *     responses:
 *       204:
 *         description: Moneda eliminada exitosamente.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Moneda no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete('/coins/:id', authMiddleware, coinController.delete);

/**
 * @openapi
 * /coins/{id}/restore:
 *   patch:
 *     summary: Restaurar una moneda borrada lógicamente
 *     tags:
 *       - Monedas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la moneda a restaurar.
 *     responses:
 *       200:
 *         description: Moneda restaurada exitosamente.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Moneda no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch('/coins/:id/restore', authMiddleware, coinController.restore);

export default router;
