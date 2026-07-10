import { Router } from "express";
import { systemController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateSystemSchema, UpdateSystemSchema } from "../schemas/system.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SystemApi:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del sistema.
 *         name:
 *           type: string
 *           description: Nombre del sistema.
 *         description:
 *           type: string
 *           description: Descripción del sistema.
 *         publisher:
 *           type: string
 *           description: Nombre o ID del publicador.
 *         isOpen:
 *           type: boolean
 *           description: Indica si el sistema es abierto/público.
 *         isBase:
 *           type: boolean
 *           description: Indica si el sistema es una plantilla base (reglas únicamente).
 *         parentId:
 *           type: string
 *           description: ID del sistema del que hereda (si lo tiene).
 *         canEdit:
 *           type: boolean
 *           description: Indica si el usuario autenticado tiene permisos de edición.
 *         racesCount:
 *           type: integer
 *           description: Cantidad de razas asociadas (incluyendo heredadas).
 *         languagesCount:
 *           type: integer
 *           description: Cantidad de idiomas asociados (incluyendo heredados).
 *         traitsCount:
 *           type: integer
 *           description: Cantidad de rasgos asociados (incluyendo heredados).
 *         globalModifierFormula:
 *           type: string
 *           description: Fórmula opcional para modificar características.
 *         initiativeBonusFormula:
 *           type: string
 *           description: Fórmula opcional para calcular el bono de iniciativa.
 *         defaultMinAttributeValue:
 *           type: number
 *         defaultMaxAttributeValue:
 *           type: number
 *         creationMinAttributeValue:
 *           type: number
 *         creationMaxAttributeValue:
 *           type: number
 *         maxLevel:
 *           type: integer
 *           description: Nivel máximo del personaje en el sistema.
 *         maxSpellLevel:
 *           type: integer
 *           description: Nivel máximo de conjuro en el sistema.
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attribute'
 *           description: Características vinculadas a este sistema (incluyendo heredadas).
 *     TypeCrearSystem:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del sistema.
 *         description:
 *           type: string
 *           description: Descripción del sistema.
 *         isOpen:
 *           type: boolean
 *           description: Indica si es abierto.
 *         isBase:
 *           type: boolean
 *           description: Indica si es una plantilla base.
 *         parentId:
 *           type: string
 *           description: ID de MongoDB del sistema padre.
 *         globalModifierFormula:
 *           type: string
 *           description: Fórmula opcional para modificar características.
 *         initiativeBonusFormula:
 *           type: string
 *           description: Fórmula opcional para calcular el bono de iniciativa.
 *         defaultMinAttributeValue:
 *           type: number
 *         defaultMaxAttributeValue:
 *           type: number
 *         creationMinAttributeValue:
 *           type: number
 *         creationMaxAttributeValue:
 *           type: number
 *         maxLevel:
 *           type: integer
 *           description: Nivel máximo del personaje en el sistema.
 *         maxSpellLevel:
 *           type: integer
 *           description: Nivel máximo de conjuro en el sistema.
 *     TypeModificarSystem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isOpen:
 *           type: boolean
 *         isBase:
 *           type: boolean
 *         parentId:
 *           type: string
 *         globalModifierFormula:
 *           type: string
 *           description: Fórmula opcional para modificar características.
 *         initiativeBonusFormula:
 *           type: string
 *           description: Fórmula opcional para calcular el bono de iniciativa.
 *         defaultMinAttributeValue:
 *           type: number
 *         defaultMaxAttributeValue:
 *           type: number
 *         creationMinAttributeValue:
 *           type: number
 *         creationMaxAttributeValue:
 *           type: number
 *         maxLevel:
 *           type: integer
 *           description: Nivel máximo del personaje en el sistema.
 *         maxSpellLevel:
 *           type: integer
 *           description: Nivel máximo de conjuro en el sistema.
 */

/**
 * @openapi
 * /systems:
 *   get:
 *     summary: Obtener los sistemas accesibles por el usuario
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de sistemas obtenidos exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SystemApi'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/systems', authMiddleware, systemController.getSystems);

/**
 * @openapi
 * /systems:
 *   post:
 *     summary: Crear un nuevo sistema
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeCrearSystem'
 *     responses:
 *       201:
 *         description: Sistema creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemApi'
 *       400:
 *         description: Nombre de sistema es obligatorio.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/systems', authMiddleware, validateSchema(CreateSystemSchema), systemController.createSystem);

/**
 * @openapi
 * /systems/{id}:
 *   put:
 *     summary: Modificar un sistema existente
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sistema.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TypeModificarSystem'
 *     responses:
 *       200:
 *         description: Sistema modificado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SystemApi'
 *       400:
 *         description: Falta ID del sistema.
 *       403:
 *         description: No tienes permisos de edición o sistema no encontrado.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/systems/:id', authMiddleware, validateSchema(UpdateSystemSchema), systemController.updateSystem);

/**
 * @openapi
 * /systems/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un sistema
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sistema a borrar.
 *     responses:
 *       204:
 *         description: Sistema borrado exitosamente.
 *       400:
 *         description: ID de sistema requerido.
 *       403:
 *         description: No tienes permisos para borrar este sistema.
 *       404:
 *         description: Sistema no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/systems/:id', authMiddleware, systemController.deleteSystem);

/**
 * @openapi
 * /systems/{id}/restore:
 *   patch:
 *     summary: Restaurar un sistema borrado lógicamente
 *     tags:
 *       - Sistemas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del sistema a restaurar.
 *     responses:
 *       200:
 *         description: Sistema restaurado exitosamente.
 *       400:
 *         description: ID de sistema requerido.
 *       403:
 *         description: No tienes permisos para restaurar este sistema.
 *       404:
 *         description: Sistema no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/systems/:id/restore', authMiddleware, systemController.restore);

export default router;
