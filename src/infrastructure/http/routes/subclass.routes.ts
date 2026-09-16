import { Router } from "express";
import { subclassController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateSubclassSchema, UpdateSubclassSchema } from "../schemas/subclass.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubclassLevelApi:
 *       type: object
 *       properties:
 *         level:
 *           type: integer
 *           minimum: 1
 *           description: Nivel de clase en el que se otorgan estos rasgos.
 *         traits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Trait'
 *           description: Rasgos hidratados otorgados en este nivel.
 *         traits_data:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             additionalProperties:
 *               type: string
 *           description: Datos dinámicos de rasgos (usos, interpolación de texto).
 *     Subclass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la subclase.
 *         ruleset:
 *           type: string
 *           description: Sistema que publica esta subclase.
 *         classId:
 *           type: string
 *           description: ID de la clase a la que pertenece (puede ser de un sistema ancestro).
 *         name:
 *           type: string
 *           description: Nombre de la subclase.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción detallada por párrafos.
 *         img:
 *           type: string
 *           description: URL de la imagen representativa.
 *         levels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubclassLevelApi'
 *           description: Progresión de rasgos por nivel.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico.
 *     SubclassLevelInput:
 *       type: object
 *       required:
 *         - level
 *       properties:
 *         level:
 *           type: integer
 *           minimum: 1
 *           description: Nivel de clase.
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *           description: ObjectIds de rasgos otorgados en este nivel. Si se omite en una actualización, se conservan.
 *         traits_data:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             additionalProperties:
 *               type: string
 *           description: Datos dinámicos de rasgos de este nivel.
 *     InputCreateSubclass:
 *       type: object
 *       required:
 *         - ruleset
 *         - classId
 *         - name
 *       properties:
 *         ruleset:
 *           type: string
 *           description: Sistema al que pertenece la subclase.
 *         classId:
 *           type: string
 *           description: ObjectId de la clase padre (propia o de un sistema ancestro).
 *         name:
 *           type: string
 *           description: Nombre de la subclase.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción por párrafos.
 *         img:
 *           type: string
 *           description: URL de la imagen.
 *         levels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubclassLevelInput'
 *           description: Progresión de rasgos (level, traits, traits_data).
 *     InputUpdateSubclass:
 *       type: object
 *       properties:
 *         ruleset:
 *           type: string
 *           description: Sistema al que pertenece la subclase.
 *         classId:
 *           type: string
 *           description: ObjectId de la clase padre.
 *         name:
 *           type: string
 *           description: Nombre de la subclase.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción por párrafos.
 *         img:
 *           type: string
 *           description: URL de la imagen.
 *         levels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubclassLevelInput'
 *           description: Niveles fusionados por número. Los traits de un nivel solo se sustituyen si el campo viene definido.
 */

/**
 * @openapi
 * /subclasses:
 *   get:
 *     summary: Obtener subclases filtradas por sistema
 *     tags:
 *       - Subclases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID del sistema para filtrar (incluye ancestros).
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: ObjectId de la clase para limitar el listado.
 *     responses:
 *       200:
 *         description: Lista de subclases devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subclass'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/subclasses", authMiddleware, subclassController.getBySystems);

/**
 * @openapi
 * /subclasses:
 *   post:
 *     summary: Crear una nueva subclase
 *     tags:
 *       - Subclases
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateSubclass'
 *     responses:
 *       201:
 *         description: Subclase creada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subclass'
 *       400:
 *         description: Datos de entrada inválidos o la clase no pertenece al árbol de sistemas.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para crear subclases en este sistema.
 *       404:
 *         description: Sistema o clase asociada no encontrados.
 *       500:
 *         description: Error del servidor.
 */
router.post("/subclasses", authMiddleware, validateSchema(CreateSubclassSchema), subclassController.create);

/**
 * @openapi
 * /subclasses/{id}:
 *   get:
 *     summary: Obtener una subclase por ID
 *     tags:
 *       - Subclases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la subclase.
 *     responses:
 *       200:
 *         description: Subclase obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subclass'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Subclase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get("/subclasses/:id", authMiddleware, subclassController.getById);

/**
 * @openapi
 * /subclasses/{id}:
 *   put:
 *     summary: Actualizar una subclase existente
 *     tags:
 *       - Subclases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la subclase a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateSubclass'
 *     responses:
 *       200:
 *         description: Subclase modificada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subclass'
 *       400:
 *         description: ID o datos inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para editar esta subclase.
 *       404:
 *         description: Subclase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put("/subclasses/:id", authMiddleware, validateSchema(UpdateSubclassSchema), subclassController.update);

/**
 * @openapi
 * /subclasses/{id}:
 *   delete:
 *     summary: Borrado lógico de una subclase
 *     tags:
 *       - Subclases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la subclase a eliminar.
 *     responses:
 *       204:
 *         description: Subclase eliminada lógicamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para borrar esta subclase.
 *       404:
 *         description: Subclase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete("/subclasses/:id", authMiddleware, subclassController.delete);

/**
 * @openapi
 * /subclasses/{id}/restore:
 *   patch:
 *     summary: Restaurar una subclase borrada lógicamente
 *     tags:
 *       - Subclases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la subclase a restaurar.
 *     responses:
 *       200:
 *         description: Subclase restaurada con éxito.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permisos para restaurar esta subclase.
 *       404:
 *         description: Subclase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch("/subclasses/:id/restore", authMiddleware, subclassController.restore);

export default router;
