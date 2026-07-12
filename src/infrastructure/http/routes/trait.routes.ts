import { Router } from "express";
import { traitController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateTraitSchema, UpdateTraitSchema } from "../schemas/trait.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Trait:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB o clave index del rasgo.
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema de reglas asociado.
 *         name:
 *           type: string
 *           description: Nombre del rasgo.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Párrafos de la descripción detallada.
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *           description: Resumen rápido de los efectos del rasgo.
 *         incompatible_traits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Trait'
 *           description: Lista de rasgos incompatibles.
 *         hidden:
 *           type: boolean
 *           description: Si está oculto en la creación.
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de IDs de habilidades (skills) que otorga el rasgo.
 *     InputCreateTrait:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema de reglas de destino.
 *         name:
 *           type: string
 *           description: Nombre del rasgo.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Párrafos de descripción.
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *           description: Párrafos de resumen.
 *         incompatible_traits:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de índices o IDs de rasgos incompatibles.
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de IDs de habilidades (skills) que otorga el rasgo.
 *     InputUpdateTrait:
 *       type: object
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema de reglas de destino.
 *         name:
 *           type: string
 *           description: Nombre del rasgo.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Párrafos de descripción.
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *           description: Párrafos de resumen.
 *         incompatible_traits:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de índices o IDs de rasgos incompatibles.
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de IDs de habilidades (skills) que otorga el rasgo.
 */

/**
 * @openapi
 * /traits:
 *   get:
 *     summary: Obtener rasgos por sistemas
 *     tags:
 *       - Rasgos (Traits)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Lista de sistemas de reglas para buscar los rasgos (incluyendo ancestros).
 *     responses:
 *       200:
 *         description: Lista de rasgos obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trait'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/traits', authMiddleware, traitController.getBySystems);

/**
 * @openapi
 * /traits:
 *   post:
 *     summary: Crear un nuevo rasgo
 *     tags:
 *       - Rasgos (Traits)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateTrait'
 *     responses:
 *       201:
 *         description: Rasgo creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trait'
 *       400:
 *         description: Entrada inválida o campos requeridos faltantes.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/traits', authMiddleware, validateSchema(CreateTraitSchema), traitController.create);

/**
 * @openapi
 * /traits/{id}:
 *   put:
 *     summary: Modificar un rasgo existente
 *     tags:
 *       - Rasgos (Traits)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rasgo a modificar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateTrait'
 *     responses:
 *       200:
 *         description: Rasgo modificado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trait'
 *       400:
 *         description: Entrada inválida.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Rasgo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put('/traits/:id', authMiddleware, validateSchema(UpdateTraitSchema), traitController.update);

/**
 * @openapi
 * /traits/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un rasgo
 *     tags:
 *       - Rasgos (Traits)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rasgo a borrar.
 *     responses:
 *       204:
 *         description: Rasgo borrado exitosamente (sin contenido).
 *       400:
 *         description: ID de rasgo requerido.
 *       403:
 *         description: No tienes permisos para borrar este rasgo.
 *       404:
 *         description: Rasgo no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/traits/:id', authMiddleware, traitController.delete);

/**
 * @openapi
 * /traits/{id}/restore:
 *   patch:
 *     summary: Restaurar un rasgo borrado lógicamente
 *     tags:
 *       - Rasgos (Traits)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rasgo a restaurar.
 *     responses:
 *       200:
 *         description: Rasgo restaurado exitosamente.
 *       400:
 *         description: ID de rasgo requerido.
 *       403:
 *         description: No tienes permisos para restaurar este rasgo.
 *       404:
 *         description: Rasgo no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/traits/:id/restore', authMiddleware, traitController.restore);

export default router;
