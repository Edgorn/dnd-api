import { Router } from "express";
import { personajeController, authMiddleware } from "../../dependencies";
import { validateSchema, validateParams, validateQuery } from "../middlewares/validateSchema";
import { ToggleFavoriteEquipmentSchema, UpdateCharacterMoneySchema, UpdateCharacterXpSchema, AddCharacterEquipmentSchema, DeleteCharacterEquipmentQuerySchema, UpdateCharacterEquipmentEquippedSchema, BindPactEquipmentSchema, CharacterIdParamsSchema, CharacterEquipmentInstanceParamsSchema, LevelUpDataQuerySchema, LevelUpSchema, PrepareSpellsSchema, LearnSpellsSchema, BindSpellPrivilegesParamsSchema, BindSpellPrivilegesSchema, UpdateCharacterCompanionsSchema } from "../schemas/personaje.schema";

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
 *         disadvantage:
 *           type: boolean
 *           description: Si es true, el personaje tiene desventaja en esta habilidad (p. ej. por armadura).
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
 *           description: Lista de conjuros conocidos de ese grupo (raza o clase).
 *         prepared:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Spell'
 *           description: >
 *             Conjuros preparados de esa clase (no aplica a raza). Incluye los elegidos
 *             por el jugador y los que un rasgo marca como siempre preparados.
 *         type:
 *           $ref: '#/components/schemas/Attribute'
 *           description: Característica de lanzamiento asociada a ese grupo de conjuros.
 *
 *     SpellcastingLevel:
 *       type: object
 *       properties:
 *         class:
 *           type: string
 *           description: ID de la clase de personaje.
 *         ability:
 *           $ref: '#/components/schemas/Attribute'
 *           description: Característica usada para lanzar conjuros.
 *         slots:
 *           $ref: '#/components/schemas/ClassSpellSlots'
 *           description: Ranuras de conjuro y trucos del nivel actual de la clase.
 *         spellSaveDc:
 *           type: number
 *           description: CD de salvación de conjuros evaluada para el personaje.
 *         spellAttackBonus:
 *           type: number
 *           description: Modificador de ataque de conjuros evaluado para el personaje.
 *         spellsPrepared:
 *           type: number
 *           description: Número máximo de conjuros que la clase puede preparar (fórmula evaluada).
 *         preparedFrom:
 *           type: string
 *           enum: [known, classList]
 *           description: Origen de los conjuros preparables.
 *         spellRepository:
 *           $ref: '#/components/schemas/SpellRepositoryConfig'
 *           description: >
 *             Repositorio de conjuros copiable de esta clase (p. ej. libro de conjuros).
 *             Si está presente, el personaje puede copiar o aprender conjuros fuera de la subida de nivel.
 *
 *     CharacterSpellPrivilegeApi:
 *       type: object
 *       properties:
 *         traitId:
 *           type: string
 *           description: ID o índice del rasgo que otorga el privilegio.
 *         classId:
 *           type: string
 *           description: ID de MongoDB de la clase a la que se vincula el privilegio.
 *         rules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellPrivilegeRule'
 *           description: Reglas del rasgo aplicadas a esta instancia.
 *         selections:
 *           type: array
 *           items:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Spell'
 *           description: Conjuros vinculados, un grupo por cada regla del rasgo.
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
 *         subclasses:
 *           type: array
 *           description: Subclases del personaje hidratadas con id de clase, nombre e id de subclase.
 *           items:
 *             type: object
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID de la clase a la que pertenece la subclase.
 *               name:
 *                 type: string
 *                 description: Nombre de la subclase.
 *               id:
 *                 type: string
 *                 description: ID de la subclase.
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
 *           description: Velocidad persistida del personaje (sin aplicar rasgos).
 *           properties:
 *             walk:
 *               type: number
 *             fly:
 *               type: number
 *             climb:
 *               type: number
 *             swim:
 *               type: number
 *             burrow:
 *               type: number
 *
 *     CharacterCompanion:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador del compañero (ObjectId). En creación es opcional; el servidor lo genera si falta.
 *         name:
 *           type: string
 *           description: Nombre narrativo del compañero.
 *         role:
 *           type: string
 *           description: Rol libre (p. ej. Mayordomo). No es un enumerado.
 *         notes:
 *           type: string
 *           description: Notas narrativas opcionales.
 *         sourceTraitId:
 *           type: string
 *           description: ID del rasgo que sugirió el roster (orientación de UI; el servidor no lo exige).
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
 *           description: Subclases del personaje hidratadas con id de clase, nombre e id de subclase.
 *           items:
 *             type: object
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID de la clase a la que pertenece la subclase.
 *               name:
 *                 type: string
 *                 description: Nombre de la subclase.
 *               id:
 *                 type: string
 *                 description: ID de la subclase.
 *         campaign:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               description: ID de la campaña asociada.
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
 *           description: Velocidad calculada del personaje, incluyendo efectos de rasgos. walk es obligatorio; fly, climb, swim y burrow son opcionales.
 *           properties:
 *             walk:
 *               type: number
 *             fly:
 *               type: number
 *             climb:
 *               type: number
 *             swim:
 *               type: number
 *             burrow:
 *               type: number
 *         skills:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SkillPersonajeApi'
 *         languages:
 *           description: >
 *             Idiomas del personaje unidos con los que concede cada rasgo.
 *             Se deduplican antes de hidratarlos.
 *           allOf:
 *             - $ref: '#/components/schemas/CreatureLanguages'
 *         proficiencies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Proficiency'
 *         traits:
 *           type: array
 *           description: >
 *             Rasgos del personaje. Si el rasgo define o referencia una elección de daño
 *             ya guardada, incluye damageChoice y sustituye {name} y {damage} en la descripción.
 *           items:
 *             $ref: '#/components/schemas/Trait'
 *         traits_data:
 *           type: object
 *           description: Textos dinámicos de rasgos del personaje. No guarda la fila de daño elegida.
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
 *         wearingArmorWithoutProficiency:
 *           type: boolean
 *           description: True si el personaje lleva armadura o escudo equipado sin la competencia requerida.
 *         feats:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Feat'
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
 *         maxCarryingCapacity:
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
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterSpellPrivilegeApi'
 *           description: Conjuros vinculados a rasgos con privilegio de conjuro.
 *         companions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterCompanion'
 *           description: Roster narrativo de compañeros. Vacío en fichas antiguas. No se valida contra companionRoster.count del rasgo.
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
 *         - feats
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
 *             $ref: '#/components/schemas/GrantedEquipmentEntry'
 *           description: >
 *             Equipamiento inicial del personaje. Cada entrada puede ser un id de catálogo
 *             o un objeto parcial con id obligatorio y campos que personalizan la instancia.
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *         traits_data:
 *           type: object
 *         traitChoices:
 *           type: object
 *           description: >
 *             Elecciones de daño al recibir un rasgo con damageChoices.
 *             La clave exterior es el id del rasgo y la interior la clave de la elección.
 *             Cada lista debe tener tantos nombres de fila como indique choose, sin repetir.
 *           additionalProperties:
 *             type: object
 *             additionalProperties:
 *               type: array
 *               items:
 *                 type: string
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
 *         feats:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de los dotes del personaje.
 *         hit_die:
 *           type: number
 *         prof_bonus:
 *           type: number
 *         companions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterCompanion'
 *           description: >
 *             Roster narrativo opcional (máximo 20). El recuento companionRoster.count
 *             de un rasgo es solo orientación de UI; el servidor no lo exige.
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

/**
 * @openapi
 * /character/{id}/pdf:
 *   get:
 *     summary: Generar la hoja de personaje en PDF
 *     description: Devuelve un archivo PDF con la hoja de personaje rellenada. Solo el dueño del personaje o el master de su campaña pueden generarlo.
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
 *         description: PDF de la hoja de personaje generado correctamente.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: ID de personaje inválido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para consultar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/character/:id/pdf', authMiddleware, validateParams(CharacterIdParamsSchema), personajeController.generatePdf);

/**
 * @openapi
 * /character/{id}/equipment:
 *   post:
 *     summary: Añadir equipamiento al inventario de un personaje
 *     description: Añade o incrementa la cantidad de un equipamiento en el inventario. Copia isMagic del catálogo y apila solo filas compatibles (mismo equipmentId e isMagic, sin pacto, sin equipar y sin favorito). Devuelve el inventario formateado.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipmentId
 *               - quantity
 *             properties:
 *               equipmentId:
 *                 type: string
 *                 description: ID de MongoDB del equipamiento de catálogo.
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Cantidad a añadir.
 *     responses:
 *       200:
 *         description: Equipamiento añadido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - equipment
 *               properties:
 *                 equipment:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CharacterEquipmentApi'
 *                   description: Inventario completo del personaje formateado.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o equipamiento de catálogo no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/equipment', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(AddCharacterEquipmentSchema), personajeController.addEquipment);

/**
 * @openapi
 * /character/{id}/equipment/{instanceId}:
 *   delete:
 *     summary: Eliminar equipamiento del inventario de un personaje
 *     description: Reduce o elimina una instancia del inventario por instanceId. Si se indica quantity y es menor que la pila, decrementa; si no, elimina la fila. No permite eliminar ítems favoritos o equipados.
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
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB de la instancia de inventario.
 *       - in: query
 *         name: quantity
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Cantidad a restar. Si se omite o no es menor que la pila, se elimina la instancia.
 *     responses:
 *       200:
 *         description: Equipamiento eliminado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - equipment
 *               properties:
 *                 equipment:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CharacterEquipmentApi'
 *                   description: Inventario completo del personaje formateado.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o instancia de equipamiento no encontrada.
 *       409:
 *         description: El equipamiento está marcado como favorito o está equipado.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/character/:id/equipment/:instanceId', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateQuery(DeleteCharacterEquipmentQuerySchema), personajeController.deleteEquipment);

/**
 * @openapi
 * /character/{id}/equipment/{instanceId}/equipped:
 *   patch:
 *     summary: Equipar o desequipar una instancia del inventario
 *     description: |
 *       Cambia el estado equipped de una instancia.
 *       Si la pila tiene quantity mayor que 1, se parte una unidad a una instancia nueva y se muta esa.
 *       La ranura ring admite 2 objetos; el resto admite 1. Un arma two_handed ocupa main_hand y off_hand.
 *       Si no hay hueco, desequipa las filas ocupadas en orden del array hasta hacer sitio.
 *       El ítem debe tener equipSlot definido. Devuelve el personaje completo y básico (incluye CA recalculada).
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
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB de la instancia de inventario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipped
 *             properties:
 *               equipped:
 *                 type: boolean
 *                 description: true para equipar, false para desequipar.
 *     responses:
 *       200:
 *         description: Estado de equipamiento actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - completo
 *                 - basico
 *               properties:
 *                 completo:
 *                   $ref: '#/components/schemas/PersonajeApi'
 *                 basico:
 *                   $ref: '#/components/schemas/PersonajeBasico'
 *       400:
 *         description: Datos inválidos o el equipamiento no tiene ranura (equipSlot).
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o instancia de equipamiento no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/equipment/:instanceId/equipped', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateSchema(UpdateCharacterEquipmentEquippedSchema), personajeController.updateEquipmentEquipped);

/**
 * @openapi
 * /character/{id}/equipment/{instanceId}/favorite:
 *   patch:
 *     summary: Marcar o desmarcar una instancia como favorita
 *     description: Actualiza el estado de favorito de una instancia del inventario. Si la pila tiene quantity mayor que 1, se parte una unidad a una instancia nueva y se muta esa.
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
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB de la instancia de inventario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isFavorite
 *             properties:
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
 *                 - instanceId
 *                 - isFavorite
 *               properties:
 *                 id:
 *                   type: string
 *                   description: ID de MongoDB del personaje.
 *                 instanceId:
 *                   type: string
 *                   description: ID de MongoDB de la instancia mutada.
 *                 isFavorite:
 *                   type: boolean
 *                   description: Nuevo estado de favorito del equipamiento.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o instancia de equipamiento no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/equipment/:instanceId/favorite', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateSchema(ToggleFavoriteEquipmentSchema), personajeController.toggleFavoriteEquipmentHandler);

/**
 * @openapi
 * /character/{id}/equipment/{instanceId}/bond:
 *   patch:
 *     summary: Vincular o desvincular el pacto de una instancia
 *     description: |
 *       Actualiza isBond de una instancia. Vincular (isBond true) solo es válido si el objeto es mágico.
 *       Si la pila tiene quantity mayor que 1, se parte una unidad a una instancia nueva y se vincula esa.
 *       Los objetos vinculados nunca se apilan. Al desvincular, se intenta fusionar con una pila compatible.
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
 *       - in: path
 *         name: instanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB de la instancia de inventario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isBond
 *             properties:
 *               isBond:
 *                 type: boolean
 *                 description: true para vincular el pacto, false para desvincularlo.
 *     responses:
 *       200:
 *         description: Pacto actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - completo
 *                 - basico
 *               properties:
 *                 completo:
 *                   $ref: '#/components/schemas/PersonajeApi'
 *                 basico:
 *                   $ref: '#/components/schemas/PersonajeBasico'
 *       400:
 *         description: Datos inválidos o el equipamiento no es mágico.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o instancia de equipamiento no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/equipment/:instanceId/bond', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateSchema(BindPactEquipmentSchema), personajeController.bindPactEquipmentHandler);

/**
 * @openapi
 * /character/{id}/money:
 *   put:
 *     summary: Actualizar el dinero de un personaje
 *     description: Reemplaza completamente el dinero del personaje y devuelve solo el array de monedas formateado (con datos de Coin del sistema).
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - money
 *             properties:
 *               money:
 *                 type: array
 *                 description: Lista completa de monedas a guardar (unit = ID de la moneda, quantity = cantidad).
 *                 items:
 *                   type: object
 *                   required:
 *                     - unit
 *                     - quantity
 *                   properties:
 *                     unit:
 *                       type: string
 *                       description: ID de la moneda.
 *                     quantity:
 *                       type: number
 *                       description: Cantidad de esa moneda.
 *     responses:
 *       200:
 *         description: Dinero actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - money
 *               properties:
 *                 money:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PersonajeMoneyItem'
 *                   description: Lista completa de monedas del sistema del personaje (incluyendo sistemas ancestros). Las monedas no poseídas se devuelven con quantity 0.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/character/:id/money', authMiddleware, validateSchema(UpdateCharacterMoneySchema), personajeController.updateMoney);

/**
 * @openapi
 * /character/{id}/companions:
 *   put:
 *     summary: Sustituir el roster narrativo de compañeros
 *     description: |
 *       Reemplaza por completo la lista de compañeros del personaje (hasta 20 entradas).
 *       Envíe un array vacío para vaciar el roster.
 *       Es un registro narrativo (nombres, roles y notas). El servidor no simula combate
 *       ni comprueba que la longitud coincida con `companionRoster.count` de ningún rasgo.
 *       El identificador del personaje va en la URL, no en el cuerpo.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companions
 *             properties:
 *               companions:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   $ref: '#/components/schemas/CharacterCompanion'
 *     responses:
 *       200:
 *         description: Roster actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - companions
 *               properties:
 *                 companions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CharacterCompanion'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/character/:id/companions', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(UpdateCharacterCompanionsSchema), personajeController.updateCompanions);

/**
 * @openapi
 * /character/{id}/xp:
 *   patch:
 *     summary: Actualizar la experiencia de un personaje
 *     description: Establece la experiencia (XP) del personaje. Solo el dueño o el master de su campaña pueden modificarla. No sube de nivel automáticamente.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - XP
 *             properties:
 *               XP:
 *                 type: integer
 *                 minimum: 0
 *                 description: Nueva cantidad de experiencia del personaje.
 *     responses:
 *       200:
 *         description: Experiencia actualizada con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/xp', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(UpdateCharacterXpSchema), personajeController.updateXp);

/**
 * @openapi
 * /character/{id}/level-up-data:
 *   get:
 *     summary: Obtener datos para subir de nivel
 *     description: |
 *       Devuelve la información necesaria para subir de nivel en una clase concreta del personaje
 *       (dado de golpe, bono de competencia, rasgos automáticos del nuevo nivel, elecciones de conjuros
 *       y, si toca, mejora de característica).
 *       `traits` y `traits_data` proceden del nivel de clase (y subclases ya asignadas); no incluyen
 *       elecciones (`traits_options`).
 *       Si el nuevo nivel es el de elección de subclase (o posterior) y el personaje aún no tiene
 *       una subclase de esa clase, se incluye `subclassChoice` con las opciones disponibles.
 *       `spell_choices` incluye una elección de trucos sintetizada a partir del tope `cantrips`
 *       de la clase y los trucos que el personaje ya conoce, una elección de conjuros conocidos
 *       sintetizada a partir de `spellsLearned` de ese nivel (lista de la clase y niveles con
 *       ranuras), más las elecciones persistidas de niveles 1–9.
 *       Si el nivel otorga Mejora de característica (`ability_score: true`), `feats` lista las dotes
 *       elegibles (sin las ya poseídas ni las que no cumplen requisitos). El jugador reparte +2
 *       (un +2 o dos +1) o elige 1 dote; el POST debe enviar `abilityScore` o `feat`.
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
 *       - in: query
 *         name: class
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB de la clase en la que se quiere subir de nivel.
 *     responses:
 *       200:
 *         description: Datos de subida de nivel obtenidos exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - class
 *                 - hit_die
 *                 - prof_bonus
 *                 - ability_score
 *               properties:
 *                 class:
 *                   type: string
 *                   description: ID de la clase.
 *                 hit_die:
 *                   type: number
 *                   description: Dado de golpe de la clase.
 *                 prof_bonus:
 *                   type: number
 *                   description: Bono de competencia correspondiente al nivel total tras la subida.
 *                 traits:
 *                   type: array
 *                   description: Rasgos automáticos que otorga el nuevo nivel de clase (incluye subclase).
 *                   items:
 *                     $ref: '#/components/schemas/Trait'
 *                 traits_data:
 *                   type: object
 *                   description: Datos dinámicos de rasgos del nuevo nivel (usos, valores numéricos, etc.).
 *                 spell_choices:
 *                   type: array
 *                   description: Elecciones de conjuros para el nuevo nivel (trucos inferidos desde cantrips, conjuros conocidos desde spellsLearned y choices persistidas).
 *                   items:
 *                     $ref: '#/components/schemas/SpellChoiceApi'
 *                 subclassChoice:
 *                   type: object
 *                   nullable: true
 *                   description: >
 *                     Menú de subclases si el personaje debe elegir en este nivel.
 *                     Incluye name, description, level y options hidratadas. Nulo si ya tiene subclase o aún no toca elegir.
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: array
 *                       items:
 *                         type: string
 *                     level:
 *                       type: integer
 *                     options:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Subclass'
 *                 ability_score:
 *                   type: boolean
 *                   description: >
 *                     True si este nivel de clase otorga Mejora de característica.
 *                     En ese caso el POST debe enviar `abilityScore` (repartir 2 puntos) o `feat`.
 *                 feats:
 *                   allOf:
 *                     - $ref: '#/components/schemas/FeatChoiceApi'
 *                   description: >
 *                     Dotes disponibles si `ability_score` es true (elige 1 en lugar de los +2).
 *                     Excluye dotes ya poseídas y las que no cumplen requisitos de atributo.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para consultar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/character/:id/level-up-data', authMiddleware, validateParams(CharacterIdParamsSchema), validateQuery(LevelUpDataQuerySchema), personajeController.getLevelUpData);

/**
 * @openapi
 * /character/{id}/level-up:
 *   post:
 *     summary: Subir de nivel a un personaje
 *     description: |
 *       Incrementa en 1 el nivel de la clase indicada, recalcula el bono de competencia
 *       según el sistema y aumenta los puntos de golpe usando `hpLevelUpFormula` del sistema
 *       del personaje. El cliente envía solo el incremento base de PG (`hpIncrease`, resultado
 *       de la tirada o media del dado); el servidor aplica la fórmula del sistema con los
 *       atributos del personaje (tras aplicar la mejora de característica, si la hay). Reinicia la XP a 0.
 *       Si `GET /character/{id}/level-up-data` devolvió `spell_choices`, el body debe incluir
 *       `spells` (array de arrays, mismo orden y `choose` que cada elección). Los conjuros se
 *       guardan en `spells[classId]`. Aplica los rasgos automáticos del nivel (`traits` y
 *       `traits_data`) al personaje. No aplica elecciones de rasgos (`traits_options`).
 *       Si un rasgo nuevo define `damageChoices`, el body debe incluir `traitChoices` con
 *       esa elección. Si ya estaba guardada, se puede omitir o repetir los mismos nombres.
 *       Si el GET devolvió `ability_score: true`, el body debe incluir exactamente uno de
 *       `abilityScore` (repartir 2 puntos: un +2 o dos +1, sin superar `defaultMaxAttributeValue`)
 *       o `feat` (ObjectId de una dote de `feats`). La dote se guarda como ID; no aplica efectos
 *       mecánicos. Un +CON afecta el PG de este nivel, no de los anteriores.
 *       Si el GET devolvió `subclassChoice`, el body debe incluir `subclass` (ObjectId de la subclase).
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class
 *               - hpIncrease
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID de MongoDB de la clase en la que se sube de nivel.
 *               hpIncrease:
 *                 type: integer
 *                 minimum: 1
 *                 description: |
 *                   Incremento base de PG (tirada o media del dado de golpe). Se inyecta en
 *                   la fórmula del sistema como `@class.hitDie` y `@hpIncrease`.
 *               spells:
 *                 type: array
 *                 description: |
 *                   Elecciones de conjuros alineadas con `spell_choices` del GET level-up-data.
 *                   `spells[i]` son los IDs elegidos para `spell_choices[i]` (misma longitud que `choose`).
 *                   Obligatorio si hay elecciones; omitir o enviar vacío si no las hay.
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: ObjectId de MongoDB del conjuro.
 *               subclass:
 *                 type: string
 *                 description: >
 *                   ObjectId de la subclase elegida. Obligatorio si el GET level-up-data
 *                   devolvió `subclassChoice`. Si el personaje ya la eligió en la creación, omitir.
 *               abilityScore:
 *                 type: object
 *                 description: >
 *                   Incrementos de característica (suma total 2). Mutuamente excluyente con `feat`.
 *                   Obligatorio si `ability_score` es true y no se envía `feat`.
 *                 required:
 *                   - increases
 *                 properties:
 *                   increases:
 *                     type: array
 *                     minItems: 1
 *                     maxItems: 2
 *                     items:
 *                       type: object
 *                       required:
 *                         - key
 *                         - bonus
 *                       properties:
 *                         key:
 *                           type: string
 *                           description: Clave de la característica del personaje (p. ej. str).
 *                         bonus:
 *                           type: integer
 *                           enum: [1, 2]
 *                           description: Puntos a sumar a esa característica.
 *               feat:
 *                 type: string
 *                 description: >
 *                   ObjectId de la dote elegida en lugar de los +2. Mutuamente excluyente con
 *                   `abilityScore`. Debe estar en `feats.options` del GET.
 *               traitChoices:
 *                 type: object
 *                 description: >
 *                   Elecciones de daño de los rasgos que entran en este nivel.
 *                   Clave exterior: id del rasgo. Clave interior: choiceKey.
 *                   El valor es la lista de nombres de fila, con longitud igual a choose.
 *                   Obligatorio si el rasgo es nuevo y define damageChoices.
 *                 additionalProperties:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Personaje actualizado tras la subida de nivel.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - completo
 *                 - basico
 *               properties:
 *                 completo:
 *                   $ref: '#/components/schemas/PersonajeApi'
 *                 basico:
 *                   $ref: '#/components/schemas/PersonajeBasico'
 *       400:
 *         description: Datos inválidos, elecciones de conjuros o ASI incorrectas, fórmula ausente, dado excedido o nivel máximo alcanzado.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/level-up', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(LevelUpSchema), personajeController.levelUp);

/**
 * @openapi
 * /character/{id}/prepared-spells:
 *   put:
 *     summary: Preparar conjuros de una clase
 *     description: |
 *       Sustituye la lista de conjuros preparados de la clase indicada.
 *       La clase debe definir `spellsPreparedFormula` y `preparedFrom`.
 *       No se pueden preparar trucos. El número de conjuros no puede superar el tope evaluado
 *       (`nivel de clase + modificador`, u otra fórmula). Los conjuros de un rasgo con
 *       `countsTowardPreparedCap: false` no cuentan para el tope y, si se envían, se ignoran
 *       al persistir. Si `preparedFrom` es `known`, cada conjuro debe estar entre los
 *       conocidos de esa clase; si es `classList`, debe pertenecer a la lista de conjuros
 *       de la clase. Solo se admiten niveles para los que la clase tenga ranuras.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class
 *               - spells
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID de MongoDB de la clase cuyos conjuros se preparan.
 *               spells:
 *                 type: array
 *                 description: IDs de los conjuros preparados (puede estar vacío).
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Personaje actualizado con los conjuros preparados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonajeApi'
 *       400:
 *         description: Datos inválidos, la clase no prepara conjuros o la selección supera el tope.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/character/:id/prepared-spells', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(PrepareSpellsSchema), personajeController.prepareSpells);

/**
 * @openapi
 * /character/{id}/spell-privileges/{traitId}:
 *   put:
 *     summary: Vincular conjuros a un rasgo con privilegio de conjuro
 *     description: |
 *       Sustituye la elección de conjuros vinculada a un rasgo del personaje (p. ej. Maestría
 *       sobre Conjuros o Conjuros característicos).
 *       El rasgo debe definir `spellPrivileges`. Cada grupo de `selections` corresponde a una
 *       regla y debe tener exactamente `choose` conjuros del nivel indicado, de la lista de la
 *       clase. Si `source` es `known`, deben estar entre los conocidos de esa clase.
 *       El primer vínculo siempre está permitido. Un vínculo posterior solo se admite si todas
 *       las reglas tienen `replace` (p. ej. 8 horas de estudio); si `replace` es nulo, se rechaza.
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
 *       - in: path
 *         name: traitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o índice del rasgo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class
 *               - selections
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID de MongoDB de la clase a la que se vincula el rasgo.
 *               selections:
 *                 type: array
 *                 description: Un grupo de IDs de conjuro por cada regla de `spellPrivileges`.
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *     responses:
 *       200:
 *         description: Personaje actualizado con los privilegios de conjuro.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonajeApi'
 *       400:
 *         description: Datos inválidos, el rasgo no otorga privilegios o no se pueden sustituir.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje o rasgo no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.put('/character/:id/spell-privileges/:traitId', authMiddleware, validateParams(BindSpellPrivilegesParamsSchema), validateSchema(BindSpellPrivilegesSchema), personajeController.bindSpellPrivileges);

/**
 * @openapi
 * /character/{id}/known-spells:
 *   post:
 *     summary: Aprender conjuros de una clase
 *     description: |
 *       Añade conjuros a la lista de conocidos de la clase indicada (no sustituye los ya conocidos).
 *       Cada conjuro debe existir, pertenecer a la lista de la clase y no estar ya conocido.
 *       Los trucos no pueden superar el tope `cantrips` del nivel actual. Los conjuros de nivel 1+
 *       solo se admiten si la clase tiene ranuras de ese nivel. No aplica el cupo `spellsLearned`
 *       (eso ocurre al subir de nivel) ni descuenta oro de `spellRepository`.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class
 *               - spells
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID de MongoDB de la clase cuyos conjuros se aprenden.
 *               spells:
 *                 type: array
 *                 minItems: 1
 *                 description: IDs de los conjuros a aprender.
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Personaje actualizado con los conjuros conocidos añadidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonajeApi'
 *       400:
 *         description: Datos inválidos, duplicados, tope de trucos o el conjuro no pertenece a la clase.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/known-spells', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(LearnSpellsSchema), personajeController.learnSpells);
router.post('/character/:id/addForm', authMiddleware, personajeController.addForm);

export default router;