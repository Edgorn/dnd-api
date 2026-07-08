import { Router } from "express";
import { languageController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { createLanguageSchema, updateLanguageSchema } from "../schemas/language.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Language:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del idioma.
 *         name:
 *           type: string
 *           description: Nombre del idioma.
 *         type:
 *           type: string
 *           description: Tipo de idioma (ej. Estándar, Exótico).
 *         description:
 *           type: string
 *           description: Descripción del idioma.
 *         script:
 *           type: string
 *           description: Alfabeto o escritura del idioma.
 *         ruleset:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs de los sistemas a los que pertenece el idioma.
 *     InputCreateLanguage:
 *       type: object
 *       required:
 *         - name
 *         - ruleset
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del idioma.
 *         description:
 *           type: string
 *           description: Descripción.
 *         type:
 *           type: string
 *           description: Tipo de idioma.
 *         script:
 *           type: string
 *           description: Alfabeto del idioma.
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema inicial asociado al idioma.
 *     InputUpdateLanguage:
 *       type: object
 *       required:
 *         - ruleset
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *         script:
 *           type: string
 *         ruleset:
 *           type: string
 */

/**
 * @openapi
 * /languages:
 *   get:
 *     summary: Obtener los idiomas asociados a ciertos sistemas
 *     tags:
 *       - Idiomas
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
 *         description: Sistema o sistemas para los cuales filtrar los idiomas.
 *     responses:
 *       200:
 *         description: Lista de idiomas obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Language'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/languages', authMiddleware, languageController.getLanguagesBySystems);

/**
 * @openapi
 * /languages:
 *   post:
 *     summary: Crear un nuevo idioma
 *     tags:
 *       - Idiomas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateLanguage'
 *     responses:
 *       201:
 *         description: Idioma creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Language'
 *       400:
 *         description: Parámetros incorrectos o idioma ya existente.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Conflicto, el idioma ya existe.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/languages', authMiddleware, validateSchema(createLanguageSchema), languageController.create);

/**
 * @openapi
 * /languages/{id}:
 *   put:
 *     summary: Actualizar un idioma existente
 *     tags:
 *       - Idiomas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del idioma a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateLanguage'
 *     responses:
 *       200:
 *         description: Idioma actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Language'
 *       400:
 *         description: Parámetros incorrectos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Idioma no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/languages/:id', authMiddleware, validateSchema(updateLanguageSchema), languageController.update);

/**
 * @openapi
 * /languages/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un idioma
 *     tags:
 *       - Idiomas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del idioma a borrar.
 *     responses:
 *       204:
 *         description: Idioma borrado exitosamente.
 *       400:
 *         description: ID de idioma requerido.
 *       403:
 *         description: No tienes permisos para borrar este idioma.
 *       404:
 *         description: Idioma no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/languages/:id', authMiddleware, languageController.delete);

/**
 * @openapi
 * /languages/{id}/restore:
 *   patch:
 *     summary: Restaurar un idioma borrado lógicamente
 *     tags:
 *       - Idiomas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del idioma a restaurar.
 *     responses:
 *       200:
 *         description: Idioma restaurado exitosamente.
 *       400:
 *         description: ID de idioma requerido.
 *       403:
 *         description: No tienes permisos para restaurar este idioma.
 *       404:
 *         description: Idioma no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/languages/:id/restore', authMiddleware, languageController.restore);

export default router;
