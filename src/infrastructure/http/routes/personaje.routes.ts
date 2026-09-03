import { Router } from "express";
import { personajeController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { ToggleFavoriteEquipmentSchema } from "../schemas/personaje.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     AtributoPersonajeApi:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la característica.
 *         name:
 *           type: string
 *           description: Nombre de la característica (e.g. Fuerza).
 *         description:
 *           type: string
 *           description: Descripción de la característica.
 *         key:
 *           type: string
 *           description: Clave identificadora (e.g. str).
 *         abbreviation:
 *           type: string
 *           description: Abreviatura (e.g. FUE).
 *         value:
 *           type: number
 *           description: Valor de la característica para el personaje.
 *
 *     SkillPersonajeApi:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         key:
 *           type: string
 *         attributeScore:
 *           type: array
 *           items:
 *             type: string
 *         value:
 *           type: number
 *           description: Nivel de competencia (0, 0.5, 1 o 2).
 *         modifier:
 *           type: number
 *           description: Modificador total de la habilidad.
 *         passive:
 *           type: number
 *           description: Valor pasivo calculado según passiveSkillFormula del sistema. Solo presente si el sistema define la fórmula.
 *
 *     Dote:
 *       type: object
 *       properties:
 *         index:
 *           type: string
 *           description: Identificador del dote.
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
 *
 *     Estado:
 *       type: object
 *       properties:
 *         index:
 *           type: string
 *           description: Identificador del estado.
 *         name:
 *           type: string
 *           description: Nombre del estado (ej. Envenenado, Aturdido).
 *
 *     ConditionalResistance:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre o fuente de la resistencia condicional.
 *         resistances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Damage'
 *           description: Tipos de daño a los que aplica la resistencia.
 *
 *     ConditionImmunity:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre o fuente de la inmunidad a condiciones.
 *         estados:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Estado'
 *           description: Estados a los que es inmune el personaje.
 *
 *     PersonajeSpellList:
 *       type: object
 *       properties:
 *         list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Spell'
 *           description: Lista de conjuros de ese nivel o grupo.
 *         type:
 *           type: string
 *           description: Tipo de lista de conjuros (ej. prepared, known).
 *
 *     SpellcastingLevel:
 *       type: object
 *       properties:
 *         class:
 *           type: string
 *           description: ID o nombre de la clase de conjuro.
 *         ability:
 *           type: string
 *           description: Característica usada para lanzar conjuros.
 *         spellcasting:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Ranuras de conjuro por nivel (clave = nivel, valor = cantidad).
 *
 *     Invocacion:
 *       type: object
 *       properties:
 *         index:
 *           type: string
 *           description: Identificador de la invocación.
 *         name:
 *           type: string
 *           description: Nombre de la invocación.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción detallada de la invocación.
 *         summary:
 *           type: array
 *           items:
 *             type: string
 *           description: Resumen de la invocación.
 *         spells:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Spell'
 *           description: Conjuros otorgados por la invocación.
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de habilidades otorgadas.
 *         requirements:
 *           type: object
 *           properties:
 *             level:
 *               type: number
 *               description: Nivel mínimo requerido.
 *             spells:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   index:
 *                     type: string
 *                   name:
 *                     type: string
 *               description: Conjuros prerequisito.
 *             traits:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   index:
 *                     type: string
 *                   name:
 *                     type: string
 *               description: Rasgos prerequisito.
 *
 *     CriaturaForm:
 *       type: object
 *       description: Forma alternativa del personaje (criatura transformada).
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador de la criatura.
 *         name:
 *           type: string
 *           description: Nombre de la forma.
 *         type:
 *           type: string
 *           description: Tipo de criatura.
 *         subtype:
 *           type: string
 *           description: Subtipo de criatura.
 *         alignment:
 *           type: string
 *           description: Alineamiento de la forma.
 *         size:
 *           type: string
 *           description: Tamaño de la forma.
 *         armor_class:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             value:
 *               type: number
 *           description: Clase de armadura de la forma.
 *         hit_points:
 *           type: number
 *           description: Puntos de golpe de la forma.
 *         hit_dice:
 *           type: string
 *           description: Dado de golpe de la forma.
 *         speed:
 *           type: object
 *           properties:
 *             walk:
 *               type: number
 *             fly:
 *               type: number
 *             climb:
 *               type: number
 *             swim:
 *               type: number
 *             notes:
 *               type: string
 *           description: Velocidades de la forma.
 *         challenge_rating:
 *           type: string
 *           description: Nivel de desafío de la forma.
 *         xp:
 *           type: number
 *           description: Experiencia asociada a la forma.
 *
 *     PersonajeBasico:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del personaje.
 *         img:
 *           type: string
 *           description: URL de la imagen del personaje.
 *         name:
 *           type: string
 *           description: Nombre del personaje.
 *         race:
 *           type: string
 *           description: Nombre de la raza del personaje.
 *         user:
 *           type: string
 *           description: Nombre del usuario creador o ID.
 *         campaign:
 *           type: string
 *           nullable: true
 *           description: Nombre de la campaña asociada (si existe).
 *         classes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: number
 *         CA:
 *           type: number
 *           description: Clase de Armadura calculada.
 *         HPMax:
 *           type: number
 *           description: Puntos de golpe máximos.
 *         HPActual:
 *           type: number
 *           description: Puntos de golpe actuales.
 *         XP:
 *           type: number
 *           description: Experiencia actual del nivel.
 *         XPMax:
 *           type: number
 *           description: Experiencia necesaria para el siguiente nivel.
 *         attributes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: number
 *         systems:
 *           type: array
 *           items:
 *             type: string
 *         speed:
 *           type: object
 *           properties:
 *             walk:
 *               type: number
 *
 *     PersonajeApi:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         img:
 *           type: string
 *         name:
 *           type: string
 *         race:
 *           type: string
 *         size:
 *           type: string
 *         classes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               class:
 *                 type: string
 *               level:
 *                 type: number
 *               name:
 *                 type: string
 *               hit_die:
 *                 type: number
 *         subclasses:
 *           type: array
 *           items:
 *             type: string
 *         campaign:
 *           type: object
 *           nullable: true
 *           properties:
 *             index:
 *               type: string
 *             name:
 *               type: string
 *               nullable: true
 *         appearance:
 *           type: object
 *           properties:
 *             age:
 *               type: number
 *             height:
 *               type: number
 *             weight:
 *               type: number
 *             eyes:
 *               type: string
 *             hair:
 *               type: string
 *             skin:
 *               type: string
 *         background:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             type:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 values:
 *                   type: array
 *                   items:
 *                     type: string
 *             history:
 *               type: array
 *               items:
 *                 type: string
 *             alignment:
 *               type: string
 *             personality:
 *               type: array
 *               items:
 *                 type: string
 *             ideals:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   alignment:
 *                     type: string
 *             bonds:
 *               type: array
 *               items:
 *                 type: string
 *             flaws:
 *               type: array
 *               items:
 *                 type: string
 *             god:
 *               type: string
 *         level:
 *           type: number
 *         XP:
 *           type: number
 *         XPMax:
 *           type: number
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AtributoPersonajeApi'
 *         systems:
 *           type: array
 *           items:
 *             type: string
 *         initiativeBonus:
 *           type: number
 *           description: Bono numérico de iniciativa calculado por el sistema (p.ej. modificador de Destreza). No incluye la tirada d20; el frontend debe sumar el dado por separado.
 *         HPMax:
 *           type: number
 *         CA:
 *           type: number
 *         speed:
 *           type: object
 *           properties:
 *             walk:
 *               type: number
 *         skills:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SkillPersonajeApi'
 *         languages:
 *           $ref: '#/components/schemas/CreatureLanguages'
 *         proficiencies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Proficiency'
 *         traits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Trait'
 *         traits_data:
 *           type: object
 *           description: Datos dinámicos de elecciones de rasgos del personaje (TraitDataMongo).
 *         resistances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Damage'
 *         conditional_resistances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConditionalResistance'
 *         condition_inmunities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConditionImmunity'
 *         prof_bonus:
 *           type: number
 *         saving_throws:
 *           type: array
 *           items:
 *             type: string
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterEquipmentApi'
 *         dotes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Dote'
 *         money:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PersonajeMoneyItem'
 *           description: Lista completa de monedas del sistema del personaje (incluyendo sistemas ancestros). Las monedas no poseídas se devuelven con quantity 0. Incluye información completa de la moneda (color, abreviatura, etc.).
 *         spells:
 *           type: object
 *           additionalProperties:
 *             $ref: '#/components/schemas/PersonajeSpellList'
 *           description: Conjuros del personaje agrupados por nivel o clase.
 *         cargaMaxima:
 *           type: number
 *         spellcasting:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellcastingLevel'
 *         invocations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Invocacion'
 *         forms:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CriaturaForm'
 *
 *     InputCrearPersonaje:
 *       type: object
 *       required:
 *         - name
 *         - background
 *         - img
 *         - speed
 *         - size
 *         - appearance
 *         - attributes
 *         - systems
 *         - race
 *         - raceId
 *         - claseId
 *         - clase
 *         - saving_throws
 *         - proficiencies
 *         - equipment
 *         - traits
 *         - traits_data
 *         - money
 *         - dotes
 *         - hit_die
 *         - prof_bonus
 *       properties:
 *         name:
 *           type: string
 *         background:
 *           type: object
 *         img:
 *           type: string
 *         speed:
 *           type: object
 *           properties:
 *             walk:
 *               type: number
 *         size:
 *           type: string
 *         appearance:
 *           type: object
 *         attributes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: number
 *         systems:
 *           type: array
 *           items:
 *             type: string
 *         race:
 *           type: string
 *         raceId:
 *           type: string
 *         campaign:
 *           type: string
 *           nullable: true
 *         languages:
 *           type: object
 *         spells:
 *           type: object
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *         double_skills:
 *           type: array
 *           items:
 *             type: string
 *         claseId:
 *           type: string
 *         clase:
 *           type: string
 *         saving_throws:
 *           type: array
 *           items:
 *             type: string
 *         proficiencies:
 *           type: array
 *           items:
 *             type: string
 *         subclase:
 *           type: string
 *         equipment:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID de MongoDB del equipamiento base.
 *               quantity:
 *                 type: number
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *         traits_data:
 *           type: object
 *         money:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - unit
 *               - quantity
 *             properties:
 *               unit:
 *                 type: string
 *                 description: ID de la moneda.
 *               quantity:
 *                 type: number
 *         dotes:
 *           type: array
 *           items:
 *             type: string
 *         hit_die:
 *           type: number
 *         prof_bonus:
 *           type: number
 */

/**
 * @openapi
 * /character:
 *   get:
 *     summary: Obtener el listado de personajes del usuario autenticado
 *     tags:
 *       - Personajes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de personajes obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PersonajeBasico'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/character', authMiddleware, personajeController.getCharacters);

/**
 * @openapi
 * /character:
 *   post:
 *     summary: Crear un nuevo personaje
 *     tags:
 *       - Personajes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCrearPersonaje'
 *     responses:
 *       200:
 *         description: Personaje creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonajeBasico'
 *       400:
 *         description: Petición inválida o faltan campos requeridos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character', authMiddleware, personajeController.createCharacter);

/**
 * @openapi
 * /character/{id}:
 *   get:
 *     summary: Obtener el detalle completo de un personaje por su ID
 *     tags:
 *       - Personajes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del personaje.
 *     responses:
 *       200:
 *         description: Detalle del personaje obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonajeApi'
 *       400:
 *         description: ID de personaje no proporcionado.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje no encontrado o no pertenece al usuario.
 *       500:
 *         description: Error del servidor.
 */
router.get('/character/:id', authMiddleware, personajeController.getCharacter);

router.get('/character/:id/pdf', authMiddleware, personajeController.generarPdf);
router.post('/character/addEquipment', authMiddleware, personajeController.añadirEquipamiento);
router.post('/character/deleteEquipment', authMiddleware, personajeController.eliminarEquipamiento);
router.post('/character/equipArmor', authMiddleware, personajeController.equiparArmadura);

/**
 * @openapi
 * /character/toggleFavoriteEquipment:
 *   post:
 *     summary: Marcar o desmarcar un equipamiento como favorito
 *     tags:
 *       - Personajes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - equip
 *               - isMagic
 *               - isBond
 *               - isFavorite
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID de MongoDB del personaje.
 *               equip:
 *                 type: string
 *                 description: ID de MongoDB del equipamiento base.
 *               isMagic:
 *                 type: boolean
 *                 description: Indica si el equipamiento es mágico.
 *               isBond:
 *                 type: boolean
 *                 description: Indica si el equipamiento está vinculado por pacto.
 *               isFavorite:
 *                 type: boolean
 *                 description: Nuevo estado de favorito del equipamiento.
 *     responses:
 *       200:
 *         description: Favorito actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - id
 *                 - equip
 *                 - isMagic
 *                 - isBond
 *                 - isFavorite
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ID de MongoDB del personaje.
 *                 equip:
 *                   type: string
 *                   description: ID de MongoDB del equipamiento base.
 *                 isMagic:
 *                   type: boolean
 *                   description: Indica si el equipamiento es mágico.
 *                 isBond:
 *                   type: boolean
 *                   description: Indica si el equipamiento está vinculado por pacto.
 *                 isFavorite:
 *                   type: boolean
 *                   description: Nuevo estado de favorito del equipamiento.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o equipamiento no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/toggleFavoriteEquipment', authMiddleware, validateSchema(ToggleFavoriteEquipmentSchema), personajeController.toggleFavoriteEquipmentHandler);

router.post('/character/updateMoney', authMiddleware, personajeController.modificarDinero);
router.post('/character/vincularPacto', authMiddleware, personajeController.vincularArmaPacto);
router.post('/character/changeXp', authMiddleware, personajeController.changeXp);
router.post('/character/levelUpData', authMiddleware, personajeController.levelUpData);
router.post('/character/levelUp', authMiddleware, personajeController.levelUp);
router.post('/character/learnSpells', authMiddleware, personajeController.aprenderListaConjuros);
router.post('/character/:id/addForm', authMiddleware, personajeController.addForm);

export default router;