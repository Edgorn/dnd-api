import { Router } from "express";
import { armorTypeController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateArmorTypeSchema, UpdateArmorTypeSchema } from "../schemas/armorType.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ArmorDuration:
 *       type: object
 *       required:
 *         - value
 *         - unit
 *       properties:
 *         value:
 *           type: number
 *           description: Cantidad de tiempo.
 *           example: 1
 *         unit:
 *           type: string
 *           description: Unidad de tiempo (libre, p. ej. minute o action).
 *           example: "minute"
 *     ArmorType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del tipo de armadura.
 *         ruleset:
 *           type: string
 *           description: ID del sistema al que pertenece.
 *         name:
 *           type: string
 *           description: Nombre del tipo (ej. Ligera, Pesada, Escudo).
 *         description:
 *           type: string
 *           description: Descripción del tipo de armadura.
 *         don:
 *           $ref: '#/components/schemas/ArmorDuration'
 *         doff:
 *           $ref: '#/components/schemas/ArmorDuration'
 *     InputCreateArmorType:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *         - don
 *         - doff
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID del sistema de reglas.
 *         name:
 *           type: string
 *           description: Nombre del tipo de armadura.
 *         description:
 *           type: string
 *           description: Descripción.
 *         don:
 *           $ref: '#/components/schemas/ArmorDuration'
 *         doff:
 *           $ref: '#/components/schemas/ArmorDuration'
 *     InputUpdateArmorType:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         don:
 *           $ref: '#/components/schemas/ArmorDuration'
 *         doff:
 *           $ref: '#/components/schemas/ArmorDuration'
 */

/**
 * @openapi
 * /armor-types:
 *   get:
 *     summary: Obtener tipos de armadura filtrados por sistemas
 *     tags:
 *       - Tipos de Armadura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID del sistema para filtrar tipos (incluye herencia de ancestros).
 *     responses:
 *       200:
 *         description: Lista de tipos de armadura devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArmorType'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/armor-types", authMiddleware, armorTypeController.getBySystems);

/**
 * @openapi
 * /armor-types/{id}:
 *   get:
 *     summary: Obtener un tipo de armadura por su ID
 *     tags:
 *       - Tipos de Armadura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de armadura.
 *     responses:
 *       200:
 *         description: Tipo de armadura obtenido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArmorType'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Tipo de armadura no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/armor-types/:id", authMiddleware, armorTypeController.getById);

/**
 * @openapi
 * /armor-types:
 *   post:
 *     summary: Crear un nuevo tipo de armadura
 *     tags:
 *       - Tipos de Armadura
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateArmorType'
 *     responses:
 *       201:
 *         description: Tipo de armadura creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArmorType'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Ya existe un tipo de armadura con ese nombre en el sistema.
 *       500:
 *         description: Error del servidor.
 */
router.post("/armor-types", authMiddleware, validateSchema(CreateArmorTypeSchema), armorTypeController.create);

/**
 * @openapi
 * /armor-types/{id}:
 *   put:
 *     summary: Actualizar un tipo de armadura existente
 *     tags:
 *       - Tipos de Armadura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de armadura a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateArmorType'
 *     responses:
 *       200:
 *         description: Tipo de armadura modificado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArmorType'
 *       400:
 *         description: Petición incorrecta.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró el tipo de armadura.
 *       500:
 *         description: Error del servidor.
 */
router.put("/armor-types/:id", authMiddleware, validateSchema(UpdateArmorTypeSchema), armorTypeController.update);

/**
 * @openapi
 * /armor-types/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un tipo de armadura
 *     tags:
 *       - Tipos de Armadura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de armadura a eliminar.
 *     responses:
 *       204:
 *         description: Tipo de armadura borrado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para eliminar.
 *       404:
 *         description: Tipo de armadura no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete("/armor-types/:id", authMiddleware, armorTypeController.delete);

/**
 * @openapi
 * /armor-types/{id}/restore:
 *   patch:
 *     summary: Restaurar un tipo de armadura borrado lógicamente
 *     tags:
 *       - Tipos de Armadura
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de armadura a restaurar.
 *     responses:
 *       200:
 *         description: Tipo de armadura restaurado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para restaurar.
 *       404:
 *         description: Tipo de armadura no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch("/armor-types/:id/restore", authMiddleware, armorTypeController.restore);

export default router;
