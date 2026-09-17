import { Router } from "express";
import { featController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { createFeatSchema, updateFeatSchema } from "../schemas/feat.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Feat:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del dote.
 *         name:
 *           type: string
 *           description: Nombre del dote.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción detallada del dote.
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *           description: Resumen del dote.
 *         ruleset:
 *           type: string
 *           description: ID del sistema al que pertenece el dote.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico. Nulo si el dote está activo.
 *         requirements:
 *           $ref: '#/components/schemas/FeatRequirements'
 *     FeatAttributeRequirement:
 *       type: object
 *       required:
 *         - key
 *         - name
 *         - min
 *       properties:
 *         key:
 *           type: string
 *           description: Clave del atributo dentro del sistema (por ejemplo, str).
 *         name:
 *           type: string
 *           description: Nombre del atributo resuelto (por ejemplo, Fuerza).
 *         min:
 *           type: integer
 *           minimum: 1
 *           description: Valor mínimo que debe tener el atributo.
 *         icon:
 *           type: string
 *           description: Icono del atributo, si existe.
 *     FeatRequirements:
 *       type: object
 *       required:
 *         - attributeMode
 *         - attributes
 *       properties:
 *         attributeMode:
 *           type: string
 *           enum: [all, any]
 *           description: all exige todos los atributos; any exige al menos uno.
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FeatAttributeRequirement'
 *           description: Requisitos de puntuación de atributo.
 *     FeatAttributeRequirementInput:
 *       type: object
 *       required:
 *         - key
 *         - min
 *       properties:
 *         key:
 *           type: string
 *           description: Clave del atributo dentro del sistema (por ejemplo, str).
 *         min:
 *           type: integer
 *           minimum: 1
 *           description: Valor mínimo que debe tener el atributo.
 *     FeatRequirementsInput:
 *       type: object
 *       properties:
 *         attributeMode:
 *           type: string
 *           enum: [all, any]
 *           description: all exige todos los atributos; any exige al menos uno.
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FeatAttributeRequirementInput'
 *           description: Requisitos de puntuación de atributo.
 *     FeatChoiceApi:
 *       type: object
 *       properties:
 *         choose:
 *           type: number
 *           description: Cantidad de dotes a seleccionar.
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Feat'
 *           description: Lista de dotes disponibles para elegir.
 *         query_type:
 *           type: string
 *           enum: [all, options, filter]
 *           description: Tipo de consulta usada para obtener las opciones.
 *     InputCreateFeat:
 *       type: object
 *       required:
 *         - name
 *         - ruleset
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del dote.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción detallada.
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *           description: Resumen del dote.
 *         ruleset:
 *           type: string
 *           description: ID del sistema al que pertenece el dote.
 *         requirements:
 *           $ref: '#/components/schemas/FeatRequirementsInput'
 *     InputUpdateFeat:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *         ruleset:
 *           type: string
 *         requirements:
 *           allOf:
 *             - $ref: '#/components/schemas/FeatRequirementsInput'
 *           nullable: true
 *           description: Requisitos del dote. Enviar nulo para eliminarlos.
 */

/**
 * @openapi
 * /feats:
 *   get:
 *     summary: Obtener los dotes asociados a ciertos sistemas
 *     tags:
 *       - Dotes
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
 *         description: Sistema o sistemas para los cuales filtrar los dotes (incluye ancestros).
 *     responses:
 *       200:
 *         description: Lista de dotes obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feat'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/feats", authMiddleware, featController.getBySystems);

/**
 * @openapi
 * /feats:
 *   post:
 *     summary: Crear un nuevo dote
 *     tags:
 *       - Dotes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateFeat'
 *     responses:
 *       201:
 *         description: Dote creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feat'
 *       400:
 *         description: Parámetros incorrectos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para crear dotes en este sistema.
 *       404:
 *         description: Sistema asociado no encontrado.
 *       409:
 *         description: Conflicto, el dote ya existe.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/feats", authMiddleware, validateSchema(createFeatSchema), featController.create);

/**
 * @openapi
 * /feats/{id}:
 *   put:
 *     summary: Actualizar un dote existente
 *     tags:
 *       - Dotes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dote a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateFeat'
 *     responses:
 *       200:
 *         description: Dote actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feat'
 *       400:
 *         description: Parámetros incorrectos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para modificar este dote.
 *       404:
 *         description: Dote o sistema asociado no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put("/feats/:id", authMiddleware, validateSchema(updateFeatSchema), featController.update);

/**
 * @openapi
 * /feats/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un dote
 *     tags:
 *       - Dotes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dote a borrar.
 *     responses:
 *       204:
 *         description: Dote borrado exitosamente.
 *       400:
 *         description: ID de dote requerido.
 *       403:
 *         description: No tienes permisos para borrar este dote.
 *       404:
 *         description: Dote o sistema asociado no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete("/feats/:id", authMiddleware, featController.delete);

/**
 * @openapi
 * /feats/{id}/restore:
 *   patch:
 *     summary: Restaurar un dote borrado lógicamente
 *     tags:
 *       - Dotes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dote a restaurar.
 *     responses:
 *       200:
 *         description: Dote restaurado exitosamente.
 *       400:
 *         description: ID de dote requerido.
 *       403:
 *         description: No tienes permisos para restaurar este dote.
 *       404:
 *         description: Dote o sistema asociado no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch("/feats/:id/restore", authMiddleware, featController.restore);

export default router;
