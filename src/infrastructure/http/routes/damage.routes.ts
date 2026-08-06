import { Router } from "express";
import { damageController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateDamageSchema, UpdateDamageSchema } from "../schemas/damage.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Damage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del tipo de daño.
 *         name:
 *           type: string
 *           description: Nombre del tipo de daño (ej. Fuego, Ácido).
 *         description:
 *           type: string
 *           description: Descripción del tipo de daño.
 *         color:
 *           type: string
 *           description: Código de color hexadecimal o nombre de color asignado.
 *         ruleset:
 *           type: string
 *           description: ID o clave del sistema al que pertenece.
 *     InputCreateDamage:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *         - color
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID del sistema de reglas.
 *         name:
 *           type: string
 *           description: Nombre del tipo de daño.
 *         description:
 *           type: string
 *           description: Descripción.
 *         color:
 *           type: string
 *           description: Color identificativo.
 *     InputUpdateDamage:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         color:
 *           type: string
 */

/**
 * @openapi
 * /damages:
 *   get:
 *     summary: Obtener tipos de daño filtrados por sistemas
 *     tags:
 *       - Daños
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID del sistema para filtrar tipos de daño (incluye herencia de ancestros).
 *     responses:
 *       200:
 *         description: Lista de tipos de daño devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Damage'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/damages', authMiddleware, damageController.getDamagesBySystems);

/**
 * @openapi
 * /damages:
 *   post:
 *     summary: Crear un nuevo tipo de daño
 *     tags:
 *       - Daños
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateDamage'
 *     responses:
 *       201:
 *         description: Tipo de daño creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Damage'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Ya existe un tipo de daño con ese nombre en el sistema.
 *       500:
 *         description: Error del servidor.
 */
router.post('/damages', authMiddleware, validateSchema(CreateDamageSchema), damageController.create);

/**
 * @openapi
 * /damages/{id}:
 *   put:
 *     summary: Actualizar un tipo de daño existente
 *     tags:
 *       - Daños
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de daño a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateDamage'
 *     responses:
 *       200:
 *         description: Tipo de daño modificado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Damage'
 *       400:
 *         description: Petición incorrecta.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró el tipo de daño.
 *       500:
 *         description: Error del servidor.
 */
router.put('/damages/:id', authMiddleware, validateSchema(UpdateDamageSchema), damageController.update);

/**
 * @openapi
 * /damages/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un tipo de daño
 *     tags:
 *       - Daños
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de daño a eliminar.
 *     responses:
 *       204:
 *         description: Tipo de daño borrado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para eliminar.
 *       404:
 *         description: Tipo de daño no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/damages/:id', authMiddleware, damageController.delete);

/**
 * @openapi
 * /damages/{id}/restore:
 *   patch:
 *     summary: Restaurar un tipo de daño borrado lógicamente
 *     tags:
 *       - Daños
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de daño a restaurar.
 *     responses:
 *       200:
 *         description: Tipo de daño restaurado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para restaurar.
 *       404:
 *         description: Tipo de daño no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/damages/:id/restore', authMiddleware, damageController.restore);

export default router;
