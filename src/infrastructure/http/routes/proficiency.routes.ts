import { Router } from "express";
import { proficiencyController, authMiddleware } from "../../dependencies";
import { validateSchema as validateData } from "../middlewares/validateSchema";
import { createProficiencySchema, updateProficiencySchema } from "../schemas/proficiency.schema";

const proficiencyRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Proficiency:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la competencia.
 *         name:
 *           type: string
 *           description: Nombre de la competencia.
 *         type:
 *           type: string
 *           description: Tipo de competencia (ej. armor, weapon, tool).
 *         parentProficiencyId:
 *           type: string
 *           nullable: true
 *           description: ID de la competencia padre, o null si no tiene.
 *         ruleset:
 *           type: string
 *           description: Sistema de juego al que pertenece la competencia.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico, o null si está activa.
 */

/**
 * @openapi
 * tags:
 *   name: Competencias
 *   description: Operaciones relacionadas con las competencias.
 */

/**
 * @openapi
 * /proficiencies:
 *   get:
 *     summary: Obtener todas las competencias por sistemas
 *     tags: [Competencias]
 *     parameters:
 *       - in: query
 *         name: systems
 *         schema:
 *           type: string
 *         description: Lista de IDs de sistemas separados por coma
 *     responses:
 *       200:
 *         description: Lista de competencias obtenida exitosamente.
 */
proficiencyRouter.get("/proficiencies", proficiencyController.getBySystems);

/**
 * @openapi
 * /proficiencies:
 *   post:
 *     summary: Crear una nueva competencia
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - ruleset
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Atletismo"
 *               type:
 *                 type: string
 *                 example: "strength"
 *               parentProficiencyId:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               ruleset:
 *                 type: string
 *                 example: "dnd5e"
 *     responses:
 *       201:
 *         description: Competencia creada exitosamente.
 */
proficiencyRouter.post(
  "/proficiencies",
  authMiddleware,
  validateData(createProficiencySchema),
  proficiencyController.create
);

/**
 * @openapi
 * /proficiencies/{id}:
 *   put:
 *     summary: Actualizar una competencia
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la competencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               parentProficiencyId:
 *                 type: string
 *                 nullable: true
 *               ruleset:
 *                 type: string
 *     responses:
 *       200:
 *         description: Competencia actualizada exitosamente.
 */
proficiencyRouter.put(
  "/proficiencies/:id",
  authMiddleware,
  validateData(updateProficiencySchema),
  proficiencyController.update
);

/**
 * @openapi
 * /proficiencies/{id}:
 *   delete:
 *     summary: Eliminar (Soft Delete) una competencia
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la competencia
 *     responses:
 *       204:
 *         description: Competencia eliminada exitosamente.
 */
proficiencyRouter.delete(
  "/proficiencies/:id",
  authMiddleware,
  proficiencyController.softDelete
);

/**
 * @openapi
 * /proficiencies/{id}/restore:
 *   patch:
 *     summary: Restaurar una competencia eliminada
 *     tags: [Competencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la competencia
 *     responses:
 *       200:
 *         description: Competencia restaurada exitosamente.
 */
proficiencyRouter.patch(
  "/proficiencies/:id/restore",
  authMiddleware,
  proficiencyController.restore
);

export default proficiencyRouter;
