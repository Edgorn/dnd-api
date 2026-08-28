import { Router } from "express";
import { propertyController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreatePropertySchema, UpdatePropertySchema } from "../schemas/property.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la propiedad de arma.
 *         name:
 *           type: string
 *           description: Nombre de la propiedad de arma (ej. Sutileza, Pesada).
 *         description:
 *           type: string
 *           description: Descripción de la propiedad de arma.
 *         ruleset:
 *           type: string
 *           description: ID o clave del sistema al que pertenece.
 *     InputCreateProperty:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID del sistema de reglas.
 *         name:
 *           type: string
 *           description: Nombre de la propiedad de arma.
 *         description:
 *           type: string
 *           description: Descripción.
 *     InputUpdateProperty:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre de la propiedad de arma.
 *         description:
 *           type: string
 *           description: Descripción.
 */

/**
 * @openapi
 * /properties:
 *   get:
 *     summary: Obtener propiedades de armas filtradas por sistemas
 *     tags:
 *       - Propiedades de Armas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID del sistema para filtrar propiedades de armas (incluye herencia de ancestros).
 *     responses:
 *       200:
 *         description: Lista de propiedades de armas devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Property'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/properties', authMiddleware, propertyController.getPropertiesBySystems);

/**
 * @openapi
 * /properties/{id}:
 *   get:
 *     summary: Obtener una propiedad de arma por su ID
 *     tags:
 *       - Propiedades de Armas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la propiedad de arma.
 *     responses:
 *       200:
 *         description: Propiedad de arma obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Propiedad de arma no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get('/properties/:id', authMiddleware, propertyController.getById);

/**
 * @openapi
 * /properties:
 *   post:
 *     summary: Crear una nueva propiedad de arma
 *     tags:
 *       - Propiedades de Armas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateProperty'
 *     responses:
 *       201:
 *         description: Propiedad de arma creada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Ya existe una propiedad de arma con ese nombre en el sistema.
 *       500:
 *         description: Error del servidor.
 */
router.post('/properties', authMiddleware, validateSchema(CreatePropertySchema), propertyController.create);

/**
 * @openapi
 * /properties/{id}:
 *   put:
 *     summary: Actualizar una propiedad de arma existente
 *     tags:
 *       - Propiedades de Armas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la propiedad de arma a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateProperty'
 *     responses:
 *       200:
 *         description: Propiedad de arma modificada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       400:
 *         description: Petición incorrecta.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró la propiedad de arma.
 *       500:
 *         description: Error del servidor.
 */
router.put('/properties/:id', authMiddleware, validateSchema(UpdatePropertySchema), propertyController.update);

/**
 * @openapi
 * /properties/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de una propiedad de arma
 *     tags:
 *       - Propiedades de Armas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la propiedad de arma a eliminar.
 *     responses:
 *       204:
 *         description: Propiedad de arma borrada exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para eliminar.
 *       404:
 *         description: Propiedad de arma no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/properties/:id', authMiddleware, propertyController.delete);

/**
 * @openapi
 * /properties/{id}/restore:
 *   patch:
 *     summary: Restaurar una propiedad de arma borrada lógicamente
 *     tags:
 *       - Propiedades de Armas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la propiedad de arma a restaurar.
 *     responses:
 *       200:
 *         description: Propiedad de arma restaurada exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para restaurar.
 *       404:
 *         description: Propiedad de arma no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/properties/:id/restore', authMiddleware, propertyController.restore);

export default router;
