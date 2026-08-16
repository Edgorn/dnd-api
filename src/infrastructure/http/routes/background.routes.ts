import { Router } from "express";
import { backgroundController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateBackgroundSchema, UpdateBackgroundSchema } from "../schemas/background.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Background:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único autogenerado por MongoDB.
 *         ruleset:
 *           type: string
 *           description: Sistema de juego al que pertenece el trasfondo.
 *         name:
 *           type: string
 *           description: Nombre del trasfondo.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción del trasfondo en párrafos.
 *         img:
 *           type: string
 *           description: URL de la imagen del trasfondo.
 *         god:
 *           type: boolean
 *           description: Indica si el trasfondo otorga deidad asociada.
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs de rasgos asociados.
 *         traits_data:
 *           type: object
 *           description: Datos adicionales y mapa de configuración para los rasgos.
 *         language_choices:
 *           type: object
 *           description: Elección de idiomas para el trasfondo.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico, o null si está activo.
 */

/**
 * @openapi
 * /backgrounds:
 *   get:
 *     summary: Obtener trasfondos por sistemas
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: Filtrar por código del sistema de juego.
 *     responses:
 *       200:
 *         description: Lista de trasfondos obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Background'
 *       401:
 *         description: No autorizado.
 */
router.get('/backgrounds', authMiddleware, backgroundController.getBackgrounds);

/**
 * @openapi
 * /backgrounds/{id}:
 *   get:
 *     summary: Obtener un trasfondo por ID
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo.
 *     responses:
 *       200:
 *         description: Trasfondo encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Background'
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.get('/backgrounds/:id', authMiddleware, backgroundController.getById);

/**
 * @openapi
 * /backgrounds:
 *   post:
 *     summary: Crear un nuevo trasfondo
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruleset
 *               - name
 *             properties:
 *               ruleset:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               img:
 *                 type: string
 *               god:
 *                 type: boolean
 *               traits:
 *                 type: array
 *                 items:
 *                   type: string
 *               traits_data:
 *                 type: object
 *               language_choices:
 *                 type: object
 *     responses:
 *       201:
 *         description: Trasfondo creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Background'
 *       400:
 *         description: Datos de entrada inválidos.
 */
router.post('/backgrounds', authMiddleware, validateSchema(CreateBackgroundSchema), backgroundController.create);

/**
 * @openapi
 * /backgrounds/{id}:
 *   put:
 *     summary: Actualizar un trasfondo existente
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ruleset:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               img:
 *                 type: string
 *               god:
 *                 type: boolean
 *               traits:
 *                 type: array
 *                 items:
 *                   type: string
 *               traits_data:
 *                 type: object
 *               language_choices:
 *                 type: object
 *     responses:
 *       200:
 *         description: Trasfondo actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Background'
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.put('/backgrounds/:id', authMiddleware, validateSchema(UpdateBackgroundSchema), backgroundController.update);

/**
 * @openapi
 * /backgrounds/{id}:
 *   delete:
 *     summary: Eliminar un trasfondo (borrado lógico)
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo a eliminar.
 *     responses:
 *       204:
 *         description: Trasfondo eliminado con éxito.
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.delete('/backgrounds/:id', authMiddleware, backgroundController.delete);

/**
 * @openapi
 * /backgrounds/{id}/restore:
 *   patch:
 *     summary: Restaurar un trasfondo eliminado previamente
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo a restaurar.
 *     responses:
 *       200:
 *         description: Trasfondo restaurado exitosamente.
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.patch('/backgrounds/:id/restore', authMiddleware, backgroundController.restore);

export default router;
