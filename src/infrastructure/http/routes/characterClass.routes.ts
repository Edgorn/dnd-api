import { Router } from "express";
import { characterClassController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateCharacterClassSchema, UpdateCharacterClassSchema } from "../schemas/characterClass.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CharacterClass:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la clase.
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema asociado.
 *         name:
 *           type: string
 *           description: Nombre de la clase.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción detallada por párrafos.
 *         img:
 *           type: string
 *           description: URL de la imagen representativa.
 *         hit_die:
 *           type: integer
 *           description: Dado de golpe de la clase (ej. 8, 10, 12).
 *         prof_bonus:
 *           type: integer
 *           description: Bonificador de competencia base.
 *         proficiencies:
 *           type: array
 *           items:
 *             type: object
 *           description: Lista de competencias otorgadas por la clase.
 *         proficiencies_choices:
 *           type: array
 *           items:
 *             type: object
 *           description: Opciones de selección de competencias.
 *         saving_throws:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attribute'
 *           description: Tiradas de salvación. En persistencia se guardan keys de atributo; en respuesta se hidratan a Attribute.
 *         skill_choices:
 *           type: object
 *           description: Elección de habilidades (choose + options/filter).
 *         spells:
 *           type: array
 *           items:
 *             type: object
 *           description: Conjuros pertenecientes a la clase.
 *         spell_choices:
 *           type: array
 *           items:
 *             type: object
 *           description: Opciones de conjuros a elegir.
 *         traits:
 *           type: array
 *           items:
 *             type: object
 *           description: Rasgos de la clase.
 *         traits_data:
 *           type: object
 *           description: Datos específicos de rasgos por nivel.
 *         equipment:
 *           type: array
 *           items:
 *             type: object
 *           description: Equipamiento inicial otorgado.
 *         equipment_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EquipmentChoiceApi'
 *           description: Opciones de equipamiento inicial resueltas (options, filter o mixed con ramas item/choice).
 *         subclasesData:
 *           type: object
 *           description: Información de las subclases disponibles.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico.
 *     InputCreateCharacterClass:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *       properties:
 *         ruleset:
 *           type: string
 *           description: Sistema al que pertenece la clase.
 *         name:
 *           type: string
 *           description: Nombre de la clase.
 *         description:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: Descripción de la clase.
 *         img:
 *           type: string
 *           description: URL de la imagen.
 *         hit_die:
 *           type: integer
 *           description: Dado de golpe de la clase (ej. 8, 10, 12).
 *         proficiencies:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de competencias otorgadas por la clase.
 *         saving_throws:
 *           type: array
 *           items:
 *             type: string
 *           description: Keys de atributos para las tiradas de salvación (ej. str, dex).
 *         skill_choices:
 *           $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           description: Elección de habilidades (choose + options o filter).
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundCharacterEquipment'
 *           description: Equipamiento fijo inicial.
 *         equipment_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           description: Opciones de equipamiento inicial.
 *     InputUpdateCharacterClass:
 *       type: object
 *       properties:
 *         ruleset:
 *           type: string
 *           description: Sistema al que pertenece la clase.
 *         name:
 *           type: string
 *           description: Nombre de la clase.
 *         description:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: Descripción de la clase.
 *         img:
 *           type: string
 *           description: URL de la imagen.
 *         hit_die:
 *           type: integer
 *           description: Dado de golpe de la clase (ej. 8, 10, 12).
 *         proficiencies:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de competencias otorgadas por la clase.
 *         saving_throws:
 *           type: array
 *           items:
 *             type: string
 *           description: Keys de atributos para las tiradas de salvación (ej. str, dex).
 *         skill_choices:
 *           $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           description: Elección de habilidades (choose + options o filter).
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundCharacterEquipment'
 *           description: Equipamiento fijo inicial.
 *         equipment_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           description: Opciones de equipamiento inicial.
 */

/**
 * @openapi
 * /character-classes:
 *   get:
 *     summary: Obtener clases filtradas por sistema
 *     tags:
 *       - Clases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema para filtrar (incluye heredados).
 *     responses:
 *       200:
 *         description: Lista de clases devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CharacterClass'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/character-classes", authMiddleware, characterClassController.getClasses);
router.get("/clases", authMiddleware, characterClassController.getClasses);

/**
 * @openapi
 * /character-classes:
 *   post:
 *     summary: Crear una nueva clase
 *     tags:
 *       - Clases
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateCharacterClass'
 *     responses:
 *       201:
 *         description: Clase creada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterClass'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post("/character-classes", authMiddleware, validateSchema(CreateCharacterClassSchema), characterClassController.create);

/**
 * @openapi
 * /character-classes/{id}:
 *   put:
 *     summary: Actualizar una clase existente
 *     tags:
 *       - Clases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase a editar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateCharacterClass'
 *     responses:
 *       200:
 *         description: Clase modificada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterClass'
 *       400:
 *         description: ID o datos inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Clase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put("/character-classes/:id", authMiddleware, validateSchema(UpdateCharacterClassSchema), characterClassController.update);

/**
 * @openapi
 * /character-classes/{id}:
 *   delete:
 *     summary: Borrado lógico de una clase
 *     tags:
 *       - Clases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase a eliminar.
 *     responses:
 *       204:
 *         description: Clase eliminada lógicamente.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Clase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete("/character-classes/:id", authMiddleware, characterClassController.delete);

/**
 * @openapi
 * /character-classes/{id}/restore:
 *   patch:
 *     summary: Restaurar una clase borrada lógicamente
 *     tags:
 *       - Clases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clase a restaurar.
 *     responses:
 *       200:
 *         description: Clase restaurada con éxito.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Clase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch("/character-classes/:id/restore", authMiddleware, characterClassController.restore);

export default router;
