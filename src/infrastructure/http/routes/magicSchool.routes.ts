import { Router } from "express";
import { magicSchoolController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateMagicSchoolSchema, UpdateMagicSchoolSchema } from "../schemas/magicSchool.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     MagicSchool:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la escuela de magia.
 *         ruleset:
 *           type: string
 *           description: ID o clave del sistema asociado.
 *         name:
 *           type: string
 *           description: Nombre de la escuela de magia (ej. Evocación).
 *         description:
 *           type: string
 *           description: Descripción detallada de la escuela de magia.
 *         color:
 *           type: string
 *           description: Código de color en formato hexadecimal (ej. #FF0000).
 *     InputCreateMagicSchool:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *         - color
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID o clave del sistema asociado.
 *         name:
 *           type: string
 *           description: Nombre de la escuela de magia.
 *         description:
 *           type: string
 *           description: Descripción detallada.
 *         color:
 *           type: string
 *           description: Código hexadecimal de color.
 *     InputUpdateMagicSchool:
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
 * /magic-schools:
 *   get:
 *     summary: Obtener escuelas de magia filtradas por sistemas
 *     tags:
 *       - EscuelasDeMagia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o clave del sistema para filtrar (se heredan sistemas ancestros).
 *     responses:
 *       200:
 *         description: Lista de escuelas de magia devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MagicSchool'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/magic-schools', authMiddleware, magicSchoolController.getMagicSchoolsBySystems);

/**
 * @openapi
 * /magic-schools:
 *   post:
 *     summary: Crear una nueva escuela de magia
 *     tags:
 *       - EscuelasDeMagia
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateMagicSchool'
 *     responses:
 *       201:
 *         description: Escuela de magia creada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MagicSchool'
 *       400:
 *         description: Faltan campos obligatorios o los datos son inválidos.
 *       401:
 *         description: No autorizado.
 *       409:
 *         description: Ya existe una escuela de magia con este nombre en el sistema.
 *       500:
 *         description: Error del servidor.
 */
router.post('/magic-schools', authMiddleware, validateSchema(CreateMagicSchoolSchema), magicSchoolController.create);

/**
 * @openapi
 * /magic-schools/{id}:
 *   put:
 *     summary: Actualizar una escuela de magia existente
 *     tags:
 *       - EscuelasDeMagia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la escuela de magia a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateMagicSchool'
 *     responses:
 *       200:
 *         description: Escuela de magia modificada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MagicSchool'
 *       400:
 *         description: Falta el ID o datos de actualización inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: No se encontró la escuela de magia.
 *       500:
 *         description: Error del servidor.
 */
router.put('/magic-schools/:id', authMiddleware, validateSchema(UpdateMagicSchoolSchema), magicSchoolController.update);

/**
 * @openapi
 * /magic-schools/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de una escuela de magia
 *     tags:
 *       - EscuelasDeMagia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la escuela de magia a borrar.
 *     responses:
 *       204:
 *         description: Escuela de magia borrada exitosamente.
 *       400:
 *         description: ID de escuela de magia requerido.
 *       403:
 *         description: No tienes permisos para borrar esta escuela de magia.
 *       404:
 *         description: Escuela de magia no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/magic-schools/:id', authMiddleware, magicSchoolController.delete);

/**
 * @openapi
 * /magic-schools/{id}/restore:
 *   patch:
 *     summary: Restaurar una escuela de magia borrada lógicamente
 *     tags:
 *       - EscuelasDeMagia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la escuela de magia a restaurar.
 *     responses:
 *       200:
 *         description: Escuela de magia restaurada exitosamente.
 *       400:
 *         description: ID de escuela de magia requerido.
 *       403:
 *         description: No tienes permisos para restaurar esta escuela de magia.
 *       404:
 *         description: Escuela de magia no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/magic-schools/:id/restore', authMiddleware, magicSchoolController.restore);

export default router;
