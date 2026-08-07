import { Router } from "express";
import { raceController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateRaceSchema, UpdateRaceSchema } from "../schemas/race.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubrazasApi:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre descriptivo de las subrazas (e.g. Subrazas).
 *         list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Race'
 *     VarianteApi:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         ability_bonuses:
 *           type: array
 *           items:
 *             type: object
 *         ability_bonus_choices:
 *           type: object
 *         skill_choices:
 *           type: object
 *         dotes:
 *           type: object
 *     Race:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de la raza (puede ser un index único o MongoDB ID).
 *         name:
 *           type: string
 *           description: Nombre de la raza (e.g. Elfo).
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción o párrafos sobre la raza.
 *         alignment:
 *           type: string
 *           description: Alineamiento típico de la raza (Opcional).
 *         img:
 *           type: string
 *           description: URL o nombre de la imagen de la raza.
 *         ruleset:
 *           type: string
 *           description: ID del sistema o reglamento al que pertenece.
 *         speed:
 *           type: object
 *           properties:
 *             walk:
 *               type: number
 *         size:
 *           type: string
 *           description: Tamaño típico (e.g. Mediano).
 *         size_range:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         weight_range:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *         age:
 *           type: object
 *           properties:
 *             maturity:
 *               type: number
 *             expectancy:
 *               type: number
 *         ability_bonuses:
 *           type: array
 *           items:
 *             type: object
 *         ability_bonus_choices:
 *           type: object
 *         skill_choices:
 *           type: object
 *         traits:
 *           type: array
 *           items:
 *             type: object
 *         traits_data:
 *           type: object
 *         languages:
 *           type: object
 *         language_choices:
 *           $ref: '#/components/schemas/LanguageChoiceApi'
 *         proficiencies_choices:
 *           type: array
 *           items:
 *             type: object
 *         spell_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellChoiceApi'
 *           description: Lista de opciones de elección de conjuros resueltas para la raza.
 *         spellcasting:
 *           $ref: '#/components/schemas/AttributeApi'
 *           description: Característica principal para lanzar conjuros de la raza (Objeto completo de la característica).
 *         parentId:
 *           type: string
 *           description: ID de la raza padre si esta raza es una subraza (Opcional).
 *         subraces:
 *           $ref: '#/components/schemas/SubrazasApi'
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VarianteApi'
 *     InputCreateRace:
 *       type: object
 *       required:
 *         - name
 *         - ruleset
 *         - speed
 *         - size
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         alignment:
 *           type: string
 *           description: Alineamiento típico de la raza (Opcional).
 *         ruleset:
 *           type: string
 *         img:
 *           type: string
 *         ability_bonuses:
 *           type: array
 *           items:
 *             type: object
 *         speed:
 *           type: object
 *           required:
 *             - walk
 *           properties:
 *             walk:
 *               type: number
 *         size:
 *           type: string
 *         size_range:
 *           type: object
 *         weight_range:
 *           type: object
 *         age:
 *           type: object
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *         traits_data:
 *           type: object
 *         languages:
 *           type: object
 *         language_choices:
 *           $ref: '#/components/schemas/LanguageChoiceApi'
 *         parentId:
 *           type: string
 *           description: ID de la raza padre si es una subraza
 *         subraces_name:
 *           type: string
 *           description: Nombre de la agrupación de subrazas (ej. "Subrazas" o "Variantes")
 *         spell_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Configuración de elecciones de conjuros (lista de IDs o filtro de búsqueda).
 *         spellcasting:
 *           type: string
 *           description: Identificador único (ObjectId) del atributo usado como característica principal para lanzar conjuros (Opcional).
 *     InputUpdateRace:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         alignment:
 *           type: string
 *           description: Alineamiento típico de la raza (Opcional).
 *         ruleset:
 *           type: string
 *         img:
 *           type: string
 *         ability_bonuses:
 *           type: array
 *           items:
 *             type: object
 *         speed:
 *           type: object
 *         size:
 *           type: string
 *         size_range:
 *           type: object
 *         weight_range:
 *           type: object
 *         age:
 *           type: object
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *         traits_data:
 *           type: object
 *         languages:
 *           type: object
 *         language_choices:
 *           $ref: '#/components/schemas/LanguageChoiceApi'
 *         parentId:
 *           type: string
 *           description: ID de la raza padre si es una subraza
 *         subraces_name:
 *           type: string
 *           description: Nombre de la agrupación de subrazas (ej. "Subrazas" o "Variantes")
 *         spell_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Configuración de elecciones de conjuros (lista de IDs o filtro de búsqueda).
 *         spellcasting:
 *           type: string
 *           description: Identificador único (ObjectId) del atributo usado como característica principal para lanzar conjuros (Opcional).
 *     ChoiceMongo:
 *       type: object
 *       properties:
 *         choose:
 *           type: number
 *           description: Cantidad de opciones que el jugador debe elegir.
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista explícita de identificadores disponibles para esta elección.
 *         filter:
 *           type: object
 *           description: Criterios de filtrado dinámico en base de datos (por ejemplo nivel o clase).
 *     SpellChoiceApi:
 *       type: object
 *       properties:
 *         choose:
 *           type: number
 *           description: Cantidad de conjuros a seleccionar.
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Spell'
 *           description: Lista de conjuros completamente poblados disponibles para elegir.
 *         query_type:
 *           type: string
 *           enum: [all, options, filter]
 *           description: Tipo de consulta usada originalmente para obtener las opciones.
 *         query_filter:
 *           type: object
 *           description: Filtro aplicado si el query_type fue 'filter'.
 */

/**
 * @openapi
 * /races:
 *   get:
 *     summary: Obtener el listado de razas (con soporte para herencia del sistema)
 *     tags:
 *       - Razas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: Filtra por el ID o nombre del sistema del reglamento.
 *     responses:
 *       200:
 *         description: Listado de razas obtenido exitosamente (ensamblado de forma recursiva).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Race'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/races', authMiddleware, raceController.getRaces);

/**
 * @openapi
 * /races:
 *   post:
 *     summary: Crear una nueva raza
 *     tags:
 *       - Razas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateRace'
 *     responses:
 *       201:
 *         description: Raza creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Race'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/races', authMiddleware, validateSchema(CreateRaceSchema), raceController.createRace);

/**
 * @openapi
 * /races/{id}:
 *   put:
 *     summary: Modificar una raza existente por ID
 *     tags:
 *       - Razas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la raza a modificar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateRace'
 *     responses:
 *       200:
 *         description: Raza modificada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Race'
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Raza no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put('/races/:id', authMiddleware, validateSchema(UpdateRaceSchema), raceController.updateRace);

/**
 * @openapi
 * /races/{id}:
 *   delete:
 *     summary: Borrado lógico de una raza
 *     tags:
 *       - Razas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la raza a borrar.
 *     responses:
 *       200:
 *         description: Raza borrada lógicamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para borrar esta raza.
 *       404:
 *         description: Raza o sistema no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/races/:id', authMiddleware, raceController.softDeleteRace);

/**
 * @openapi
 * /races/{id}/restore:
 *   patch:
 *     summary: Restaurar una raza borrada lógicamente
 *     tags:
 *       - Razas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la raza a restaurar.
 *     responses:
 *       200:
 *         description: Raza restaurada exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para restaurar esta raza.
 *       404:
 *         description: Raza o sistema no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/races/:id/restore', authMiddleware, raceController.restoreRace);

export default router;
