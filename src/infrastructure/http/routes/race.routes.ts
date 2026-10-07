import { Router } from "express";
import { raceController, authMiddleware } from "../../dependencies";
import { CreateRaceSchema, UpdateRaceSchema, UpsertRaceOverrideSchema, RaceOverrideQuerySchema, GetRacesQuerySchema, GetRaceByIdQuerySchema, GetRaceCatalogQuerySchema } from "../schemas/race.schema";
import { validateSchema, validateQuery } from "../middlewares/validateSchema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubracesApi:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre descriptivo de las subrazas (e.g. Subrazas).
 *         list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Race'
 *     VariantApi:
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
 *         feats:
 *           $ref: '#/components/schemas/FeatChoiceApi'
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
 *         levels:
 *           type: array
 *           description: >
 *             Filas guardadas en esta raza. Al subir de nivel se fusionan con las de la raza padre;
 *             la subraza sobrescribe las claves.
 *           items:
 *             $ref: '#/components/schemas/RaceLevel'
 *         languages:
 *           type: object
 *         language_choices:
 *           $ref: '#/components/schemas/LanguageChoiceApi'
 *         proficiencies_choices:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               choose:
 *                 type: number
 *                 description: Cantidad de competencias a seleccionar.
 *               options:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Proficiency'
 *                 description: Competencias disponibles para esta elección, hidratadas.
 *               query_type:
 *                 type: string
 *                 enum: [all, options, filter]
 *                 description: Tipo de consulta usada para obtener las opciones.
 *               query_filter:
 *                 type: object
 *                 description: Filtro aplicado si query_type es filter.
 *           description: Elecciones independientes de competencias (por ejemplo instrumento y herramienta).
 *         spell_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellChoiceApi'
 *           description: Lista de opciones de elección de conjuros resueltas para la raza.
 *         spellcasting:
 *           $ref: '#/components/schemas/AttributeApi'
 *           description: Característica principal para lanzar conjuros de la raza. En una subraza se hereda de la raza padre si el hijo no la define.
 *         creatureType:
 *           $ref: '#/components/schemas/CreatureType'
 *           description: Tipo de criatura de la raza. En una subraza se hereda de la raza padre si el hijo no lo define.
 *         playable:
 *           type: boolean
 *           description: Indica si la raza puede usarse para crear personajes. Las razas antiguas sin este campo se consideran jugables.
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterEquipmentApi'
 *           description: Equipamiento fijo concedido por la raza, con personalizaciones aplicadas.
 *         parentId:
 *           type: string
 *           description: ID de la raza padre si esta raza es una subraza (Opcional).
 *         subraces:
 *           $ref: '#/components/schemas/SubracesApi'
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VariantApi'
 *         inherited:
 *           type: boolean
 *           description: Indica si la raza pertenece a un sistema ancestro del ruleset consultado.
 *         overriddenFields:
 *           type: array
 *           items:
 *             type: string
 *             enum: [name, description, img, alignment]
 *           description: Campos de flavor sustituidos por un parche del sistema consultado.
 *         overrideRuleset:
 *           type: string
 *           description: ID del sistema cuyo parche se ha aplicado.
 *     RaceSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         img:
 *           type: string
 *         descriptionTeaser:
 *           type: string
 *           description: Primer párrafo de la descripción, recortado a unos 200 caracteres, tras aplicar parches de flavor.
 *         ruleset:
 *           type: string
 *         playable:
 *           type: boolean
 *         inherited:
 *           type: boolean
 *         overriddenFields:
 *           type: array
 *           items:
 *             type: string
 *             enum: [name, description, img, alignment]
 *         overrideRuleset:
 *           type: string
 *         parentId:
 *           type: string
 *         size:
 *           type: string
 *         speed:
 *           type: object
 *           properties:
 *             walk:
 *               type: number
 *         creatureType:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         ability_bonuses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               name:
 *                 type: string
 *               bonus:
 *                 type: number
 *         ability_bonus_choices:
 *           type: object
 *           properties:
 *             choose:
 *               type: number
 *         skill_choices:
 *           type: object
 *           properties:
 *             choose:
 *               type: number
 *         subraces:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             list:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RaceSummary'
 *     RaceCatalogItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         creatureTypeId:
 *           type: string
 *           nullable: true
 *         ruleset:
 *           type: string
 *     RaceDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/Race'
 *         - type: object
 *           properties:
 *             subraces:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RaceSummary'
 *               description: Subrazas del nodo en forma ligera (RaceSummary), no hidratadas.
 *     RaceOverride:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID del parche.
 *         ruleset:
 *           type: string
 *           description: ID del sistema hijo que aplica el parche.
 *         entityType:
 *           type: string
 *           enum: [race]
 *           description: Tipo de entidad parcheada.
 *         sourceId:
 *           type: string
 *           description: ID canónico de la raza del sistema ancestro.
 *         patch:
 *           $ref: '#/components/schemas/RaceFlavorPatch'
 *     RaceFlavorPatch:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre local de la raza.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción local de la raza.
 *         img:
 *           type: string
 *           description: Imagen local de la raza.
 *         alignment:
 *           type: string
 *           description: Alineamiento local de la raza.
 *     InputUpsertRaceOverride:
 *       type: object
 *       required:
 *         - ruleset
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID o nombre del sistema hijo que aplica el parche.
 *         name:
 *           type: string
 *           nullable: true
 *           description: Nombre local. Envíe null para dejar de sobreescribir este campo.
 *         description:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: Descripción local. Envíe null para dejar de sobreescribir este campo.
 *         img:
 *           type: string
 *           nullable: true
 *           description: Imagen local. Envíe null para dejar de sobreescribir este campo.
 *         alignment:
 *           type: string
 *           nullable: true
 *           description: Alineamiento local. Envíe null para dejar de sobreescribir este campo.
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
 *         ability_bonus_choices:
 *           nullable: true
 *           description: >
 *             Elección de bonificadores de característica. Misma forma que ChoiceMongo.
 *             Solo `choose` ofrece todos los atributos del sistema (y ancestros).
 *             `options` son keys de atributo (cha, dex, …). `filter` busca atributos por criterio.
 *             Cada opción hidratada tiene bonus 1. Envíe null para borrar la elección.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
 *         skill_choices:
 *           nullable: true
 *           description: >
 *             Elección de habilidades. Misma forma que ChoiceMongo.
 *             Solo `choose` ofrece todas las habilidades del sistema (y ancestros).
 *             `options` son identificadores de habilidad. `filter` busca habilidades por criterio.
 *             Envíe null para borrar la elección.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
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
 *         proficiencies_choices:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Elecciones independientes de competencias (IDs en options o filtro, por ejemplo type). Envíe null para borrar la lista.
 *         spell_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Configuración de elecciones de conjuros (lista de IDs o filtro de búsqueda).
 *         spellcasting:
 *           type: string
 *           description: Identificador único (ObjectId) del atributo usado como característica principal para lanzar conjuros (Opcional).
 *         equipment:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/GrantedEquipmentEntry'
 *           description: Equipamiento fijo concedido por la raza.
 *         creatureTypeId:
 *           type: string
 *           nullable: true
 *           description: ID del tipo de criatura. Debe existir, no estar borrado y pertenecer al sistema de la raza o a un ancestro.
 *         playable:
 *           type: boolean
 *           description: Si se omite, la raza se guarda como jugable. Una subraza no puede ser jugable si su padre no lo es.
 *         levels:
 *           type: array
 *           nullable: true
 *           description: >
 *             Niveles de raza, del 1 al 20 y sin repetir. Cada fila puede conceder rasgos
 *             y sustituir tokens (por ejemplo {dice}) al subir el nivel total del personaje.
 *             null borra la lista.
 *           items:
 *             $ref: '#/components/schemas/RaceLevel'
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
 *         ability_bonus_choices:
 *           nullable: true
 *           description: >
 *             Elección de bonificadores de característica. Misma forma que ChoiceMongo.
 *             Solo `choose` ofrece todos los atributos del sistema (y ancestros).
 *             `options` son keys de atributo (cha, dex, …). `filter` busca atributos por criterio.
 *             Cada opción hidratada tiene bonus 1. Envíe null para borrar la elección.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
 *         skill_choices:
 *           nullable: true
 *           description: >
 *             Elección de habilidades. Misma forma que ChoiceMongo.
 *             Solo `choose` ofrece todas las habilidades del sistema (y ancestros).
 *             `options` son identificadores de habilidad. `filter` busca habilidades por criterio.
 *             Envíe null para borrar la elección.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
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
 *         proficiencies_choices:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Elecciones independientes de competencias (IDs en options o filtro, por ejemplo type). Envíe null para borrar la lista.
 *         spell_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Configuración de elecciones de conjuros (lista de IDs o filtro de búsqueda).
 *         spellcasting:
 *           type: string
 *           description: Identificador único (ObjectId) del atributo usado como característica principal para lanzar conjuros (Opcional).
 *         equipment:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/GrantedEquipmentEntry'
 *           description: Equipamiento fijo concedido por la raza.
 *         creatureTypeId:
 *           type: string
 *           nullable: true
 *           description: ID del tipo de criatura. Solo se actualiza si se envía. Debe existir, no estar borrado y pertenecer al sistema de la raza o a un ancestro.
 *         playable:
 *           type: boolean
 *           description: Solo se actualiza si se envía. Una subraza no puede ser jugable si su padre no lo es.
 *         levels:
 *           type: array
 *           nullable: true
 *           description: >
 *             Niveles de raza, del 1 al 20 y sin repetir. null borra la lista.
 *             Se aplican según el nivel total del personaje.
 *           items:
 *             $ref: '#/components/schemas/RaceLevel'
 *     RaceLevel:
 *       type: object
 *       required:
 *         - level
 *       properties:
 *         level:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Nivel total del personaje en el que se aplica la fila.
 *         traits_data:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             additionalProperties:
 *               type: string
 *           description: >
 *             Sustituciones por rasgo. La clave exterior es el id del rasgo y la interior
 *             el token, por ejemplo "{dice}".
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
 *     description: >
 *       Si se indica ruleset, se incluyen razas de ancestros y se aplican parches de flavor
 *       del sistema consultado (el más cercano gana). El parámetro playable filtra razas raíz
 *       y subrazas; si se omite, se devuelven todas. Con view=summary se devuelve un árbol
 *       ligero (RaceSummary) sin hidratar rasgos, conjuros ni opciones de elección.
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
 *       - in: query
 *         name: playable
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Si es true, solo razas jugables (incluye las que no tienen el campo). Si es false, solo las no jugables. Si se omite, se devuelven todas.
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [summary, full]
 *         description: summary devuelve RaceSummary. Si se omite o es full, se hidrata el árbol completo (Race).
 *     responses:
 *       200:
 *         description: Listado de razas obtenido exitosamente (ensamblado de forma recursiva).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/Race'
 *                   - $ref: '#/components/schemas/RaceSummary'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/races', authMiddleware, validateQuery(GetRacesQuerySchema), raceController.getRaces);

/**
 * @openapi
 * /races:
 *   post:
 *     summary: Crear una nueva raza
 *     description: >
 *       Crea la raza y devuelve el detalle canónico (RaceDetail), igual que GET /races/{id}
 *       sin ruleset: nodo hidratado y subrazas hijas como RaceSummary.
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
 *               $ref: '#/components/schemas/RaceDetail'
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
 * /races/catalog:
 *   get:
 *     summary: Obtener el catálogo plano de razas
 *     description: Lista plana de raíces y subrazas (id, name, creatureTypeId, ruleset) con herencia de tipo de criatura y parches de nombre. Pensado para elecciones de catálogo y subir de nivel.
 *     tags:
 *       - Razas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema. Incluye razas de ancestros.
 *       - in: query
 *         name: playable
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Si es true, solo razas jugables. Si es false, solo las no jugables. Si se omite, se devuelven todas.
 *     responses:
 *       200:
 *         description: Catálogo obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RaceCatalogItem'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/races/catalog', authMiddleware, validateQuery(GetRaceCatalogQuerySchema), raceController.getCatalog);

/**
 * @openapi
 * /races/{id}:
 *   get:
 *     summary: Obtener una raza hidratada por ID
 *     description: >
 *       Devuelve el nodo pedido hidratado (Race). Las subrazas hijas van como RaceSummary
 *       (sin rasgos, conjuros ni opciones de elección). Si se indica ruleset, se aplican
 *       parches de flavor y el indicador inherited.
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
 *         description: ID de la raza.
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema consultado. La raza debe pertenecer a ese sistema o a un ancestro.
 *     responses:
 *       200:
 *         description: Raza obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RaceDetail'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Raza no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get('/races/:id', authMiddleware, validateQuery(GetRaceByIdQuerySchema), raceController.getById);

/**
 * @openapi
 * /races/{id}/override:
 *   get:
 *     summary: Obtener el parche de flavor de una raza heredada
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
 *         description: ID canónico de la raza del sistema padre.
 *       - in: query
 *         name: ruleset
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema hijo que posee el parche.
 *     responses:
 *       200:
 *         description: Parche obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RaceOverride'
 *       400:
 *         description: La raza no es heredable en ese sistema.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para consultar este parche.
 *       404:
 *         description: Raza, sistema o parche no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/races/:id/override', authMiddleware, validateQuery(RaceOverrideQuerySchema), raceController.getRaceOverride);

/**
 * @openapi
 * /races/{id}/override:
 *   put:
 *     summary: Crear o actualizar el parche de flavor de una raza heredada
 *     description: El sistema hijo reescribe descripción, nombre, imagen o alineamiento sin modificar la raza canónica del padre. Envíe null en un campo para dejar de sobreescribirlo.
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
 *         description: ID canónico de la raza del sistema padre.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpsertRaceOverride'
 *     responses:
 *       200:
 *         description: Parche guardado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RaceOverride'
 *       400:
 *         description: Datos inválidos o la raza no es heredable en ese sistema.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para modificar parches en este sistema.
 *       404:
 *         description: Raza o sistema no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/races/:id/override', authMiddleware, validateSchema(UpsertRaceOverrideSchema), raceController.upsertRaceOverride);

/**
 * @openapi
 * /races/{id}/override:
 *   delete:
 *     summary: Eliminar el parche de flavor de una raza heredada
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
 *         description: ID canónico de la raza del sistema padre.
 *       - in: query
 *         name: ruleset
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema hijo que posee el parche.
 *     responses:
 *       200:
 *         description: Parche eliminado exitosamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para borrar este parche.
 *       404:
 *         description: Raza, sistema o parche no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/races/:id/override', authMiddleware, validateQuery(RaceOverrideQuerySchema), raceController.deleteRaceOverride);

/**
 * @openapi
 * /races/{id}:
 *   put:
 *     summary: Modificar una raza existente por ID
 *     description: >
 *       Actualiza la raza y devuelve el detalle canónico (RaceDetail), igual que GET /races/{id}
 *       sin ruleset: nodo hidratado y subrazas hijas como RaceSummary.
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
 *               $ref: '#/components/schemas/RaceDetail'
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
