import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { systemController } from "../../dependencies";

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
 *         canEdit:
 *           type: boolean
 *           description: Indica si el usuario autenticado tiene permisos de edición.
 *         racesCount:
 *           type: integer
 *           description: Cantidad de razas asociadas.
 *         languagesCount:
 *           type: integer
 *           description: Cantidad de idiomas asociados.
 *         traitsCount:
 *           type: integer
 *           description: Cantidad de rasgos asociados.
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
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attribute'
 *           description: Características vinculadas a este sistema.
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
 *     TypeModificarSystem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isOpen:
 *           type: boolean
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
router.post('/systems', authMiddleware, systemController.createSystem);

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
router.put('/systems/:id', authMiddleware, systemController.updateSystem);

export default router;
