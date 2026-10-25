import { Router } from "express";
import { characterController, authMiddleware } from "../../dependencies";
import { validateSchema, validateParams, validateQuery } from "../middlewares/validateSchema";
import { ToggleFavoriteEquipmentSchema, UpdateCharacterMoneySchema, UpdateCharacterXpSchema, AddCharacterEquipmentSchema, DeleteCharacterEquipmentQuerySchema, UpdateCharacterEquipmentEquippedSchema, BindWeaponBondSchema, CharacterIdParamsSchema, CharacterEquipmentInstanceParamsSchema, CharacterFormParamsSchema, CharacterConditionParamsSchema, LevelUpDataQuerySchema, GetCharacterQuerySchema, GetCharactersQuerySchema, LevelUpSchema, PrepareSpellsSchema, LearnSpellsSchema, CopySpellsSchema, BindSpellPrivilegesParamsSchema, BindSpellPrivilegesSchema, UpdateCharacterCompanionsSchema, PatchCharacterFlavorSchema, CharacterRestSchema, SpendHitDiceSchema, ApplyCharacterHpSchema, SpendSpellSlotSchema, ApplyCharacterConditionSchema, UpdateCharacterConditionSchema, AddCharacterFormSchema, UseTraitSchema } from "../schemas/character.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PendingCatalogChoice:
 *       type: object
 *       required:
 *         - traitId
 *         - key
 *         - add
 *         - options
 *         - chosen
 *       properties:
 *         traitId:
 *           type: string
 *           description: ID del rasgo que ya posee el personaje o que recibe en este nivel.
 *         key:
 *           type: string
 *           description: Clave de la elección de catálogo dentro del rasgo.
 *           example: favoredTerrain
 *         add:
 *           type: integer
 *           minimum: 1
 *           description: Nombres nuevos que hay que añadir en este nivel de clase.
 *         options:
 *           type: array
 *           description: >
 *             Opciones que aún se pueden elegir. Las no repetibles ya elegidas desaparecen;
 *             las repetibles se quedan. Si el rasgo usa source creatureTypes, aquí llegan
 *             una opción por tipo de criatura del sistema (el name es el id del tipo)
 *             más las opciones manuales. Las que exigen razas incluyen eligibleRaces.
 *           items:
 *             $ref: '#/components/schemas/TraitCatalogOption'
 *         chosen:
 *           type: array
 *           description: >
 *             Elección ya guardada. La lista enviada debe empezar por estos valores,
 *             en el mismo orden, con los mismos textos e idioma.
 *             Si la elección es simple, cada elemento es un string.
 *             Si tiene textos libres, razas o idioma, cada elemento es un objeto.
 *           items:
 *             oneOf:
 *               - type: string
 *                 example: Bosque
 *               - $ref: '#/components/schemas/CatalogChoiceEntry'
 *         language:
 *           type: string
 *           enum: [optional, required]
 *           description: >
 *             Si se omite, la elección no pide idioma. optional permite languageId nulo.
 *             required exige un idioma de languageOptions.
 *         languageOptions:
 *           type: array
 *           description: >
 *             Idiomas de los sistemas del personaje y de sus ancestros. Solo aparece
 *             si language es optional o required.
 *           items:
 *             $ref: '#/components/schemas/Language'
 *     PendingDamageChoice:
 *       type: object
 *       required:
 *         - traitId
 *         - traitName
 *         - key
 *         - choose
 *         - options
 *       properties:
 *         traitId:
 *           type: string
 *           description: ID del rasgo que este nivel concede y cuya elección de daño aún no está guardada.
 *         traitName:
 *           type: string
 *           description: Nombre del rasgo, para mostrar el menú sin leer traits[].
 *         key:
 *           type: string
 *           description: Clave de la elección de daño. Es la que se envía en traitChoices.
 *         choose:
 *           type: integer
 *           minimum: 1
 *           description: Número de filas que hay que enviar en traitChoices para esta clave.
 *         source:
 *           type: string
 *           enum:
 *             - damageTypes
 *           description: >
 *             Si es damageTypes, options ya vienen expandidas: una por tipo de daño
 *             de los sistemas del personaje y ancestros, más las filas manuales.
 *         options:
 *           type: array
 *           description: >
 *             Opciones hidratadas. Se pinta label y se envía name en traitChoices.
 *             Con source damageTypes, name y damageTypeId son el id del tipo; label
 *             es damage.name.
 *           items:
 *             $ref: '#/components/schemas/TraitDamageChoiceOption'
 *     PendingSkillProficiencyChoice:
 *       type: object
 *       required:
 *         - add
 *         - value
 *         - options
 *       properties:
 *         add:
 *           type: integer
 *           minimum: 1
 *           description: Skills a elegir en este nivel (POST skillProficiencyPicks).
 *         value:
 *           type: number
 *           enum: [0.5, 1, 2, 3]
 *           description: Multiplicador que se aplicará a las skills elegidas.
 *         options:
 *           type: array
 *           description: Skills competentes que aún no tienen ese multiplicador o uno mayor.
 *           items:
 *             $ref: '#/components/schemas/Skill'
 *     CatalogChoiceEntry:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre de una opción del catálogo.
 *           example: Humanoides
 *         inputs:
 *           type: array
 *           description: Textos libres de esa opción. Cada uno tiene entre 1 y 80 caracteres y no se repite en la elección.
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 80
 *           example: ["Orcos", "Trasgos"]
 *         raceIds:
 *           type: array
 *           description: >
 *             IDs de razas del tipo de criatura de la opción. Cada una debe existir,
 *             no estar borrada y pertenecer a los sistemas del personaje o a sus ancestros.
 *             Es excluyente con inputs: las entradas antiguas con textos libres se siguen leyendo.
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *         languageId:
 *           type: string
 *           nullable: true
 *           description: >
 *             Idioma del catálogo de los sistemas del personaje. Nulo si no hablan
 *             y la elección es optional. Se rechaza si la elección no admite idioma.
 *     CharacterAttribute:
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
 *           description: Valor de la característica para el personaje, con bonos de rasgo aplicados.
 *         modifier:
 *           type: number
 *           description: Modificador calculado con la fórmula del sistema a partir de value.
 *         max:
 *           type: number
 *           description: >
 *             Tope efectivo. Es el máximo del rasgo si algún rasgo lo declara para esa clave;
 *             si no, defaultMaxAttributeValue del sistema.
 *
 *     SkillSheetApi:
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
 *         id:
 *           type: string
 *           description: ID de MongoDB del estado.
 *         name:
 *           type: string
 *           description: Nombre del estado (ej. Envenenado, Aturdido).
 *         description:
 *           type: string
 *           description: Descripción del estado.
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
 *         conditions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Estado'
 *           description: Estados a los que es inmune el personaje.
 *
 *     CharacterSpellList:
 *       type: object
 *       properties:
 *         list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Spell'
 *           description: Lista de conjuros conocidos de ese grupo (raza o clase), incluidos los extra.
 *         extra:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Spell'
 *           description: >
 *             Conjuros que cuentan como de esa clase pero no suman al total conocido
 *             (p. ej. Secretos Mágicos). Ya van incluidos en list.
 *         ritualOnlyExtraIds:
 *           type: array
 *           items:
 *             type: string
 *           description: >
 *             IDs de extra que el rasgo solo concede como ritual. No se marcan si
 *             el mismo conjuro está en conocidos, extras persistidos u otra fuente
 *             con ranura. El cliente no debe ofrecer gastar ranura para ellos.
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
 *           description: >
 *             Todas las reglas del rasgo (con `atLevel`). El cliente filtra las activas
 *             con el nivel de la clase vinculada.
 *         selections:
 *           type: array
 *           items:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Spell'
 *           description: >
 *             Conjuros vinculados, un grupo por cada regla activa (`atLevel` menor o igual
 *             al nivel de esa clase), en el mismo orden que esas reglas.
 *
 *     CharacterOptionSelection:
 *       type: object
 *       properties:
 *         optionId:
 *           type: string
 *         groupId:
 *           type: string
 *         traitId:
 *           type: string
 *         classId:
 *           type: string
 *         level:
 *           type: integer
 *         groupName:
 *           type: string
 *         trait:
 *           $ref: '#/components/schemas/Trait'
 *     PendingOptionChoice:
 *       type: object
 *       properties:
 *         groupId:
 *           type: string
 *         groupName:
 *           type: string
 *         choose:
 *           type: integer
 *         replace:
 *           type: integer
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PendingOptionChoiceOption'
 *         selected:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterOptionSelection'
 *
 *     CharacterForm:
 *       type: object
 *       description: Forma de criatura vinculada a un conjuro (o legado sin origen).
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           description: ID de esta instancia de forma en el personaje.
 *         purpose:
 *           type: string
 *           enum: [companion, self, target]
 *           description: Ausente en formas legacy; esas no se pueden activar. self y target sí.
 *         spellId:
 *           type: string
 *         spell:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         creature:
 *           $ref: '#/components/schemas/Creature'
 *         active:
 *           type: boolean
 *           description: True si es la forma propia activa (overlay de estadísticas).
 *     CriaturaForm:
 *       allOf:
 *         - $ref: '#/components/schemas/CharacterForm'
 *
 *     CharacterBasic:
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
 *         ac:
 *           type: number
 *           description: Clase de Armadura calculada.
 *         hpMax:
 *           type: number
 *           description: Puntos de golpe máximos.
 *         hpCurrent:
 *           type: number
 *           description: Puntos de golpe actuales.
 *         xp:
 *           type: number
 *           description: Experiencia actual del nivel.
 *         xpMax:
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
 *     CharacterListItem:
 *       description: >
 *         Tarjeta de listado. Los campos attributes, systems y speed solo se
 *         incluyen si la petición lleva include=combatSeed. La campaña sigue
 *         devolviendo CharacterBasic completo.
 *       allOf:
 *         - $ref: '#/components/schemas/CharacterBasic'
 *
 *     CharacterEquipmentStateResponse:
 *       type: object
 *       required:
 *         - basic
 *         - equipment
 *         - ac
 *         - speed
 *         - wearingArmorWithoutProficiency
 *         - disadvantageSkillKeys
 *         - resistances
 *         - conditionImmunities
 *       properties:
 *         basic:
 *           $ref: '#/components/schemas/CharacterBasic'
 *         equipment:
 *           type: array
 *           description: Inventario hidratado (incluye attackBonus y overlay de stances en damageBonus).
 *           items:
 *             $ref: '#/components/schemas/CharacterEquipmentApi'
 *         ac:
 *           type: number
 *           description: Clase de armadura de ficha tras el cambio.
 *         speed:
 *           type: object
 *           description: Velocidad derivada de ficha (rasgos y penalización de armadura).
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
 *         wearingArmorWithoutProficiency:
 *           type: boolean
 *           description: True si lleva armadura o escudo equipado sin la competencia requerida.
 *         disadvantageSkillKeys:
 *           type: array
 *           description: Claves de habilidad con desventaja por armadura (p. ej. stealth). El cliente las fusiona en skills.
 *           items:
 *             type: string
 *         resistances:
 *           type: array
 *           description: Resistencias efectivas de ficha (incluye overlay de stances no suprimidas).
 *           items:
 *             $ref: '#/components/schemas/Damage'
 *         conditionImmunities:
 *           type: array
 *           description: Inmunidades a estados efectivas de ficha (incluye overlay de stances no suprimidas).
 *           items:
 *             $ref: '#/components/schemas/ConditionImmunity'
 *
 *     CharacterSpellStateResponse:
 *       type: object
 *       required:
 *         - spells
 *         - spellsById
 *       description: >
 *         Slice de conjuros para merge en el cliente (misma forma que GET view=sheet).
 *         No incluye CA, inventario ni PG. `spellPrivileges` solo aparece al vincular privilegios.
 *         Clave ausente = conservar el valor local.
 *       properties:
 *         spells:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             required:
 *               - list
 *             properties:
 *               list:
 *                 type: array
 *                 items:
 *                   type: string
 *               extra:
 *                 type: array
 *                 items:
 *                   type: string
 *               prepared:
 *                 type: array
 *                 items:
 *                   type: string
 *               ritualOnlyExtraIds:
 *                 type: array
 *                 items:
 *                   type: string
 *         spellsById:
 *           type: object
 *           additionalProperties:
 *             $ref: '#/components/schemas/SpellRef'
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterSpellPrivilegeApi'
 *
 *     CharacterStatePatch:
 *       type: object
 *       description: >
 *         Parche sparse de ficha para merge en el cliente. Clave ausente = conservar
 *         el valor local. No rehidrata la ficha completa ni el catálogo de conjuros.
 *         `forms[].creature` llega como resumen. Tras activar o desactivar una forma,
 *         el parche incluye CA, PG, atributos, velocidad y resistencias efectivos
 *         (el overlay de forma no persiste PG; al desactivar vuelven los de ficha).
 *       properties:
 *         basic:
 *           $ref: '#/components/schemas/CharacterBasic'
 *         hpCurrent:
 *           type: number
 *         hpMax:
 *           type: number
 *         hitDice:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterHitDice'
 *         spellSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterSpellSlot'
 *         traitResources:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterTraitResource'
 *         activeTraitIds:
 *           type: array
 *           items:
 *             type: string
 *         ac:
 *           type: number
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
 *             burrow:
 *               type: number
 *         size:
 *           type: string
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterAttribute'
 *         initiativeBonus:
 *           type: number
 *         resistances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Damage'
 *         conditionImmunities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConditionImmunity'
 *         activeConditions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterActiveCondition'
 *         traits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Trait'
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterEquipmentApi'
 *         wearingArmorWithoutProficiency:
 *           type: boolean
 *         disadvantageSkillKeys:
 *           type: array
 *           items:
 *             type: string
 *         forms:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterForm'
 *         activeFormId:
 *           type: string
 *           nullable: true
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
 *     CharacterSpellSlot:
 *       type: object
 *       description: >
 *         Ranuras derivadas de la tabla de clase (`slots` o `fixedLevelSlots`).
 *         Solo se persiste `spent` en el personaje.
 *       required:
 *         - classId
 *         - pool
 *         - level
 *         - total
 *         - spent
 *         - remaining
 *       properties:
 *         classId:
 *           type: string
 *           description: ID de MongoDB de la clase.
 *         pool:
 *           type: string
 *           enum: [standard, fixedLevel]
 *           description: >
 *             `standard` es la tabla por nivel. `fixedLevel` es una bolsa de nivel fijo.
 *             El `level` de fixedLevel es el de esa bolsa, no el del conjuro.
 *         level:
 *           type: integer
 *           minimum: 1
 *           maximum: 9
 *         total:
 *           type: integer
 *           minimum: 1
 *           description: Ranuras máximas de esa bolsa. No se persiste.
 *         spent:
 *           type: integer
 *           minimum: 0
 *         remaining:
 *           type: integer
 *           minimum: 0
 *
 *     CharacterHitDice:
 *       type: object
 *       description: >
 *         Bolsa de dados de golpe derivada. `total` es el nivel de esa clase;
 *         solo se persiste `spent` en el personaje. `bonusPerDie` es
 *         `restRules.hitDiceSpending.bonusFormula` evaluada (0 si se omite).
 *       required:
 *         - classId
 *         - hitDie
 *         - total
 *         - spent
 *         - remaining
 *         - bonusPerDie
 *       properties:
 *         classId:
 *           type: string
 *           description: ID de MongoDB de la clase.
 *         hitDie:
 *           type: integer
 *           description: Caras del dado de golpe de la clase.
 *         total:
 *           type: integer
 *           minimum: 1
 *           description: Dados máximos (nivel en esa clase). No se persiste.
 *         spent:
 *           type: integer
 *           minimum: 0
 *           description: Dados gastados desde la última recuperación.
 *         remaining:
 *           type: integer
 *           minimum: 0
 *           description: total menos spent.
 *         bonusPerDie:
 *           type: integer
 *           description: >
 *             Bono que el cliente suma a cada dado al gastar. Sale de
 *             `restRules.hitDiceSpending.bonusFormula` (0 si no hay fórmula).
 *
 *     CharacterActiveCondition:
 *       type: object
 *       required:
 *         - conditionId
 *         - name
 *       properties:
 *         conditionId:
 *           type: string
 *           description: ID de MongoDB del estado de catálogo.
 *         name:
 *           type: string
 *           description: Nombre hidratado del catálogo.
 *         level:
 *           type: integer
 *           minimum: 1
 *           description: Nivel activo. Se omite en estados sin tabla de niveles.
 *
 *     CharacterTraitResource:
 *       type: object
 *       description: >
 *         Usos gastados persistidos. remaining no va aquí; se lee en
 *         traits[].action.remaining (uses resuelto menos spent).
 *       required:
 *         - traitId
 *         - spent
 *       properties:
 *         traitId:
 *           type: string
 *           description: ID del rasgo cuyos usos se cuentan.
 *         spent:
 *           type: integer
 *           minimum: 0
 *           description: Usos gastados desde el último descanso que recarga el rasgo. No es remaining.
 *
 *     CharacterApi:
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
 *               hitDie:
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
 *         xp:
 *           type: number
 *         xpMax:
 *           type: number
 *         attributes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterAttribute'
 *         systems:
 *           type: array
 *           items:
 *             type: string
 *         initiativeBonus:
 *           type: number
 *           description: Bono numérico de iniciativa calculado por el sistema (p.ej. modificador de Destreza). No incluye la tirada d20; el frontend debe sumar el dado por separado.
 *         hpMax:
 *           type: number
 *         hpCurrent:
 *           type: number
 *           description: Puntos de golpe actuales. Con una forma propia activa coincide con los PG de la criatura (solo lectura).
 *         ac:
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
 *             $ref: '#/components/schemas/SkillSheetApi'
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
 *         traitsData:
 *           type: object
 *           description: Textos dinámicos de rasgos del personaje. No guarda la fila de daño elegida.
 *         traitResources:
 *           type: array
 *           description: >
 *             Persistido: traitId y spent. El máximo está en traits[].action.uses
 *             (ya resuelto). Los usos que quedan están en traits[].action.remaining.
 *             POST `/character/{id}/traits/{traitId}/use` incrementa spent.
 *           items:
 *             $ref: '#/components/schemas/CharacterTraitResource'
 *         activeTraitIds:
 *           type: array
 *           items:
 *             type: string
 *           description: >
 *             Stances encendidas (p. ej. Furia). Coincide con traits[].action.active.
 *             No altera el PDF. POST use las añade; deactivate y rest las quitan según `endStancesOn`.
 *         hitDice:
 *           type: array
 *           description: >
 *             Dados de golpe por clase. POST `/character/{id}/hit-dice/spend` incrementa spent
 *             y suma PG (la tirada la hace el cliente). Durante un descanso, `hitDiceSpends`
 *             en POST `/character/{id}/rest` si `restRules.hitDiceSpending.on` incluye el `type`.
 *             El descanso recupera dados según `restRules.hitPointRecovery`.
 *           items:
 *             $ref: '#/components/schemas/CharacterHitDice'
 *         spellSlots:
 *           type: array
 *           description: >
 *             Ranuras por clase y bolsa. POST `/character/{id}/spell-slots/spend` incrementa spent.
 *             El descanso recupera según `restRules.spellSlotRecovery`.
 *           items:
 *             $ref: '#/components/schemas/CharacterSpellSlot'
 *         activeConditions:
 *           type: array
 *           description: >
 *             Estados activos del personaje. POST `/character/{id}/conditions` aplica;
 *             PATCH con `delta` cambia el nivel; DELETE lo quita. El descanso aplica
 *             `Condition.recovery` si cubre el `type`.
 *           items:
 *             $ref: '#/components/schemas/CharacterActiveCondition'
 *         resistances:
 *           type: array
 *           description: >
 *             Resistencias permanentes más, en la ficha de juego, las condicionales
 *             del grupo de cada stance activa. El PDF no incluye las de stance.
 *           items:
 *             $ref: '#/components/schemas/Damage'
 *         conditionalResistances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConditionalResistance'
 *         conditionImmunities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConditionImmunity'
 *           description: >
 *             Inmunidades permanentes más, en la ficha de juego, las condicionales
 *             del grupo de cada stance activa. El PDF no incluye las de stance.
 *         conditionalConditionImmunities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConditionImmunity'
 *           description: >
 *             Inmunidades a estados agrupadas por conditionalResistanceGroup
 *             (p. ej. Furia). Siempre visibles; en juego se suman a conditionImmunities
 *             si la stance del grupo está activa.
 *         proficiencyBonus:
 *           type: number
 *         savingThrows:
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
 *         money:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterMoneyItem'
 *           description: Lista completa de monedas del sistema del personaje (incluyendo sistemas ancestros). Las monedas no poseídas se devuelven con quantity 0. Incluye información completa de la moneda (color, abreviatura, etc.).
 *         spells:
 *           type: object
 *           additionalProperties:
 *             $ref: '#/components/schemas/CharacterSpellList'
 *           description: Conjuros del personaje agrupados por nivel o clase.
 *         maxCarryingCapacity:
 *           type: number
 *         spellcasting:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellcastingLevel'
 *         optionSelections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterOptionSelection'
 *           description: Opciones elegidas (invocaciones, metamagia, maniobras, etc.).
 *         forms:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterForm'
 *         activeFormId:
 *           type: string
 *           nullable: true
 *           description: ID de la forma propia activa. Overlay de lectura; no persiste los PG de la criatura.
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
 *     SpellRef:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - level
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         level:
 *           type: integer
 *         school:
 *           type: object
 *         ritual:
 *           type: boolean
 *         components:
 *           type: object
 *     CreatureFormSummary:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - size
 *         - cr
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         size:
 *           type: string
 *         cr:
 *           type: number
 *     CharacterCombat:
 *       type: object
 *       description: Vista de combate. Omite inventario, dinero, formas inactivas y textos de catálogo.
 *     CharacterSheet:
 *       type: object
 *       description: Ficha con conjuros por id (`spellsById`) y formas inactivas resumidas.
 *     LevelUpDataCompact:
 *       type: object
 *       description: Menús de subida de nivel con SpellRef y subclases resumidas.
 *     InputCreateCharacter:
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
 *         - classId
 *         - className
 *         - savingThrows
 *         - proficiencies
 *         - equipment
 *         - traits
 *         - traitsData
 *         - money
 *         - hitDie
 *         - proficiencyBonus
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
 *         skillProficiencyPicks:
 *           type: array
 *           items:
 *             type: string
 *           description: >
 *             Skills de nivel 1 que reciben el multiplicador de skillProficiencyChoices
 *             de la clase o subclase. Deben ser competencias (el array skills ya resuelto).
 *         classId:
 *           type: string
 *         className:
 *           type: string
 *         savingThrows:
 *           type: array
 *           items:
 *             type: string
 *         proficiencies:
 *           type: array
 *           items:
 *             type: string
 *         subclass:
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
 *         traitsData:
 *           type: object
 *         traitChoices:
 *           type: object
 *           description: >
 *             Elecciones al crear el personaje. La clave exterior es el id del rasgo y la
 *             interior la clave de la elección.
 *             Con damageChoices, la lista tiene tantos nombres de fila como indique choose.
 *             Con catalogChoices, la lista incluye las opciones que conceden los grants
 *             con atLevel menor o igual al nivel 1 de la clase. Una opción simple es un
 *             string. Si la opción pide textos o la elección admite idioma, es un objeto
 *             con name, inputs y languageId.
 *           additionalProperties:
 *             type: object
 *             additionalProperties:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - type: string
 *                   - $ref: '#/components/schemas/CatalogChoiceEntry'
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
 *         hitDie:
 *           type: number
 *         proficiencyBonus:
 *           type: number
 *         companions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterCompanion'
 *           description: >
 *             Roster narrativo opcional (máximo 20). El recuento companionRoster.count
 *             de un rasgo es solo orientación de UI; el servidor no lo exige.
 *     InputPatchCharacterFlavor:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         img:
 *           type: string
 *           description: URL de la imagen del personaje. Cadena vacía para vaciarla.
 *         appearance:
 *           type: object
 *           additionalProperties: false
 *           description: Parche parcial del aspecto. Debe incluir al menos un campo.
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
 *           additionalProperties: false
 *           description: Parche parcial de historia y flavor. No admite name ni type del trasfondo. Debe incluir al menos un campo.
 *           properties:
 *             history:
 *               description: Texto con saltos de línea o array de párrafos. Se guarda como array.
 *               oneOf:
 *                 - type: string
 *                 - type: array
 *                   items:
 *                     type: string
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
 *     CharacterFlavor:
 *       type: object
 *       required:
 *         - img
 *         - appearance
 *         - background
 *       properties:
 *         img:
 *           type: string
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
 */

/**
 * @openapi
 * /character:
 *   get:
 *     summary: Obtener el listado de personajes del usuario autenticado
 *     description: >
 *       Por defecto devuelve la tarjeta (id, img, name, race, user, campaign,
 *       clases, subclases, CA, HP, XP) sin attributes, systems ni speed.
 *       Con include=combatSeed se añaden esos tres campos (valores de combate).
 *     tags:
 *       - Personajes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [combatSeed]
 *         description: Si es combatSeed, incluye attributes, systems y speed.
 *     responses:
 *       200:
 *         description: Listado de personajes obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CharacterListItem'
 *       400:
 *         description: Petición inválida.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/character', authMiddleware, validateQuery(GetCharactersQuerySchema), characterController.getCharacters);

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
 *             $ref: '#/components/schemas/InputCreateCharacter'
 *     responses:
 *       200:
 *         description: Personaje creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterBasic'
 *       400:
 *         description: Petición inválida o faltan campos requeridos.
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character', authMiddleware, characterController.createCharacter);

/**
 * @openapi
 * /character/{id}:
 *   get:
 *     summary: Obtener el detalle de un personaje por su ID
 *     description: |
 *       Por defecto (`view=full` o sin `view`) devuelve la ficha completa (`CharacterApi`).
 *       `view=sheet` compacta conjuros en `spellsById` y resume formas inactivas.
 *       `view=combat` recorta inventario, dinero y consultas que no usa el combate.
 *       Las stances activas (p. ej. Furia) aplican overlays en las tres vistas.
 *       El PDF usa datos base, sin estos overlays.
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
 *         name: view
 *         schema:
 *           type: string
 *           enum: [full, sheet, combat]
 *         description: Vista de la ficha. full es el valor por defecto y mantiene el JSON histórico.
 *     responses:
 *       200:
 *         description: Detalle del personaje obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/CharacterApi'
 *                 - $ref: '#/components/schemas/CharacterSheet'
 *                 - $ref: '#/components/schemas/CharacterCombat'
 *       400:
 *         description: ID de personaje no proporcionado.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje no encontrado o no pertenece al usuario.
 *       500:
 *         description: Error del servidor.
 */
router.get('/character/:id', authMiddleware, validateQuery(GetCharacterQuerySchema), characterController.getCharacter);

/**
 * @openapi
 * /character/{id}:
 *   patch:
 *     summary: Actualizar imagen, aspecto e historia de un personaje
 *     description: |
 *       Parche parcial de flavor. Envíe al menos uno de `img`, `appearance` o `background`.
 *       `appearance` y `background` se fusionan campo a campo; no reemplace el objeto entero
 *       si solo cambia un valor. `history` admite texto (se parte por saltos de línea) o array.
 *       No se puede cambiar el nombre ni el tipo del trasfondo. El identificador va en la URL.
 *       Solo el dueño o el master de su campaña pueden modificarlo.
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
 *             $ref: '#/components/schemas/InputPatchCharacterFlavor'
 *     responses:
 *       200:
 *         description: Flavor actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterFlavor'
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
router.patch('/character/:id', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(PatchCharacterFlavorSchema), characterController.updateFlavor);

/**
 * @openapi
 * /character/{id}/pdf:
 *   get:
 *     summary: Generar la hoja de personaje en PDF
 *     description: |
 *       Devuelve un archivo PDF con la hoja de personaje rellenada (datos base: CA y
 *       daño sin overlays de stances). Solo el dueño del personaje o el master de su
 *       campaña pueden generarlo.
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
router.get('/character/:id/pdf', authMiddleware, validateParams(CharacterIdParamsSchema), characterController.generatePdf);

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
router.post('/character/:id/equipment', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(AddCharacterEquipmentSchema), characterController.addEquipment);

/**
 * @openapi
 * /character/{id}/equipment/{instanceId}:
 *   delete:
 *     summary: Eliminar equipamiento del inventario de un personaje
 *     description: Reduce o elimina una instancia del inventario por instanceId. Si se indica quantity y es menor que la pila, decrementa; si no, elimina la fila. No permite eliminar ítems favoritos, equipados o vinculados por pacto.
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
 *         description: El equipamiento está marcado como favorito, está equipado o es un arma vinculada.
 *       500:
 *         description: Error del servidor.
 */
router.delete('/character/:id/equipment/:instanceId', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateQuery(DeleteCharacterEquipmentQuerySchema), characterController.deleteEquipment);

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
 *       El ítem debe tener equipSlot definido. Devuelve la tarjeta básica y un delta de ficha
 *       (inventario hidratado, CA, velocidad derivada, desventaja de sigilo, resistencias e inmunidades).
 *       No reenvía conjuros, formas ni sabor.
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
 *               $ref: '#/components/schemas/CharacterEquipmentStateResponse'
 *       400:
 *         description: Datos inválidos o el equipamiento no tiene ranura (equipSlot).
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o instancia de equipamiento no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/equipment/:instanceId/equipped', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateSchema(UpdateCharacterEquipmentEquippedSchema), characterController.updateEquipmentEquipped);

/**
 * @openapi
 * /character/{id}/equipment/{instanceId}/favorite:
 *   patch:
 *     summary: Marcar o desmarcar una instancia como favorita
 *     description: |
 *       Actualiza el estado de favorito de una instancia del inventario. Si la pila tiene
 *       quantity mayor que 1, se parte una unidad a una instancia nueva y se muta esa:
 *       `instanceId` de la respuesta es la fila mutada (puede ser distinta a la de la URL).
 *       `splitFrom` aparece solo si hubo corte e indica la pila original y su quantity restante.
 *       No recalcula la ficha; el cliente debe fusionar el inventario localmente.
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
 *                   description: ID de MongoDB de la instancia mutada. Si se partió una pila, es el de la unidad nueva.
 *                 isFavorite:
 *                   type: boolean
 *                   description: Nuevo estado de favorito del equipamiento.
 *                 splitFrom:
 *                   type: object
 *                   description: Presente solo si se partió una pila con quantity mayor que 1.
 *                   properties:
 *                     instanceId:
 *                       type: string
 *                       description: ID de la pila original (el de la URL).
 *                     quantity:
 *                       type: integer
 *                       description: Cantidad que queda en la pila original.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o instancia de equipamiento no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/equipment/:instanceId/favorite', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateSchema(ToggleFavoriteEquipmentSchema), characterController.toggleFavoriteEquipmentHandler);

/**
 * @openapi
 * /character/{id}/equipment/{instanceId}/bond:
 *   patch:
 *     summary: Vincular o desvincular un arma de una instancia
 *     description: |
 *       Actualiza isBond de una instancia. Vincular exige un rasgo con weaponBond, que el objeto
 *       sea un arma mágica (cuerpo a cuerpo si weaponBond.melee) y deja un solo vínculo.
 *       Destruye un arma invocada previa. No equipa el arma. Desvincular solo aplica a origin
 *       bound; las invocadas se descartan con deactivate. Si la pila tiene quantity mayor que 1,
 *       se parte una unidad. Devuelve el mismo delta que al equipar (tarjeta + inventario y
 *       derivados), no el personaje completo.
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
 *                 description: true para vincular el arma, false para desvincularla.
 *     responses:
 *       200:
 *         description: Vínculo actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterEquipmentStateResponse'
 *       400:
 *         description: Datos inválidos o el equipamiento no es mágico.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Personaje o instancia de equipamiento no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/equipment/:instanceId/bond', authMiddleware, validateParams(CharacterEquipmentInstanceParamsSchema), validateSchema(BindWeaponBondSchema), characterController.bindWeaponBondHandler);

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
 *                     $ref: '#/components/schemas/CharacterMoneyItem'
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
router.put('/character/:id/money', authMiddleware, validateSchema(UpdateCharacterMoneySchema), characterController.updateMoney);

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
router.put('/character/:id/companions', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(UpdateCharacterCompanionsSchema), characterController.updateCompanions);

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
 *               - xp
 *             properties:
 *               xp:
 *                 type: integer
 *                 minimum: 0
 *                 description: Nueva cantidad de experiencia del personaje.
 *     responses:
 *       200:
 *         description: Experiencia actualizada con éxito. xpMax no cambia (no hay subida de nivel automática).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - xp
 *                 - xpMax
 *               properties:
 *                 xp:
 *                   type: integer
 *                   description: Experiencia persistida.
 *                 xpMax:
 *                   type: integer
 *                   description: Experiencia necesaria para el siguiente nivel según las reglas del sistema.
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
router.patch('/character/:id/xp', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(UpdateCharacterXpSchema), characterController.updateXp);

/**
 * @openapi
 * /character/{id}/level-up-data:
 *   get:
 *     summary: Obtener datos para subir de nivel
 *     description: |
 *       Devuelve la información necesaria para subir de nivel en una clase concreta del personaje
 *       (dado de golpe, bono de competencia, rasgos automáticos del nuevo nivel, elecciones de conjuros
 *       y, si toca, mejora de característica).
 *       Sin `view` o con `view=full` el JSON es el histórico. `view=compact` usa SpellRef en los menús
 *       de conjuros, resúmenes de subclase (detalle en GET /subclasses/:id) y `dip.proficiencies` como `{id,name}`.
 *       Si `class` no está en `classes[]`, es un dip (`newClass: true`, nivel de clase 1) y `dip`
 *       incluye requisitos hidratados, competencias fijas y elecciones recortadas (sin las ya poseídas).
 *       `GET` no rechaza requisitos fallidos: `requirementsMet` indica si el personaje cumple los de
 *       todas las clases implicadas (clases actuales + la nueva en un dip, o todas las poseídas al
 *       continuar siendo ya multiclase). Un personaje de una sola clase no tiene requisitos al seguirla.
 *       Los rasgos se filtran por `stackGroup` e `incompatible_traits` respecto a los ya poseídos.
 *       `traits` y `traitsData` proceden del nivel de clase (y subclases ya asignadas).
 *       Si el nivel de raza, clase o subclase cambia `traitsData`
 *       respecto al nivel anterior, `traits` vuelve a incluir ese rasgo. Todos los rasgos de `traits` se
 *       devuelven con la descripción y el resumen sustituidos con el `traitsData` del personaje
 *       fusionado con el del nivel.
 *       Después se cierran igual que en la ficha: las elecciones ya guardadas sustituyen `{name}`,
 *       `{damage}`, `{area}` y `{save}`, y la CD de la acción sustituye `{dc}` con los atributos
 *       actuales y el bono de competencia del nivel siguiente. La mejora de característica de este
 *       nivel aún no está elegida, así que no entra en esa CD. Si un rasgo referencia la elección
 *       de daño de otro que no cambia en este nivel, esa elección se resuelve igualmente y el rasgo
 *       origen no se añade a `traits`.
 *       Si el nuevo nivel es el de elección de subclase (o posterior) y el personaje aún no tiene
 *       una subclase de esa clase, se incluye `subclassChoice` con las opciones disponibles.
 *       `skillChoices` son habilidades nuevas a elegir en este nivel de clase o de una subclase
 *       ya asignada (opciones ya poseídas recortadas). Si aún debe elegir subclase, las elecciones
 *       de cada opción van en `subclassChoice.options[].levels[].skillChoices`.
 *       `optionChoices` de la raíz son grupos de opciones de este nivel de clase o de una subclase
 *       ya asignada. Si aún debe elegir subclase, las elecciones de cada opción van hidratadas
 *       (`PendingOptionChoice`: groupName, options con available/unmet, selected) en
 *       `subclassChoice.options[].levels[].optionChoices`.
 *       `spellChoices` incluye una elección de trucos sintetizada a partir del tope `cantrips`
 *       de la clase y los trucos que el personaje ya conoce, una elección de conjuros conocidos
 *       sintetizada a partir de `spellsLearned` de ese nivel (lista de la clase y niveles con
 *       ranuras), más las elecciones persistidas de niveles 1–9.
 *       Si el personaje ya tiene subclase de esa clase, las elecciones sintetizadas de lista de
 *       clase (trucos, conocidos y `spellChanges.to`) incluyen `expandedSpells`. Si aún debe elegir
 *       subclase, esos extras van en `subclassChoice.options[].expandedSpells` para sustituir en el cliente.
 *       Si la clase define `spellReplacement` y el personaje ya tiene conjuros conocidos de esa
 *       clase (nivel de clase 2+), `spellChanges` ofrece un recambio opcional (hasta `choose`
 *       pares from/to). No forma parte de `spellChoices` y se puede omitir.
 *       Si el nivel otorga Mejora de característica (`abilityScore: true`), `abilityScoreAlternative`
 *       lista las opciones del grupo configurado en el sistema o la clase (elige 1 en lugar de los +2).
 *       El POST debe enviar `abilityScore` o, si hay alternativa, `abilityScoreOption`.
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
 *         description: ID de MongoDB de la clase en la que se quiere subir de nivel. Puede ser una clase nueva (dip) de los sistemas del personaje.
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [full, compact]
 *         description: compact reduce el payload de menús. full es el valor por defecto.
 *     responses:
 *       200:
 *         description: Datos de subida de nivel obtenidos exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - class
 *                 - hitDie
 *                 - proficiencyBonus
 *                 - abilityScore
 *                 - newClass
 *               properties:
 *                 class:
 *                   type: string
 *                   description: ID de la clase.
 *                 hitDie:
 *                   type: number
 *                   description: Dado de golpe de la clase.
 *                 proficiencyBonus:
 *                   type: number
 *                   description: Bono de competencia correspondiente al nivel total tras la subida.
 *                 traits:
 *                   type: array
 *                   description: Rasgos automáticos del nuevo nivel de clase (incluye subclase) y rasgos cuyo texto cambia por el traitsData de la raza, la clase o la subclase. La descripción y el resumen ya incluyen traitsData, las elecciones guardadas y la CD de la acción.
 *                   items:
 *                     $ref: '#/components/schemas/Trait'
 *                 traitsData:
 *                   type: object
 *                   description: Datos dinámicos de rasgos del nuevo nivel (usos, valores numéricos, etc.).
 *                 spellChoices:
 *                   type: array
 *                   description: >
 *                     Elecciones de conjuros para el nuevo nivel (trucos inferidos desde cantrips,
 *                     conjuros conocidos desde spellsLearned y choices persistidas). Con subclase
 *                     asignada, las sintetizadas de lista de clase incluyen expandedSpells.
 *                   items:
 *                     $ref: '#/components/schemas/SpellChoiceApi'
 *                 spellChanges:
 *                   type: object
 *                   description: >
 *                     Recambio opcional de conjuros conocidos (p. ej. bardo). `choose` es el máximo
 *                     de pares. `from` son los conocidos sustituibles; `to` es la lista de destinos
 *                     (lista de la clase y niveles con espacios, sin los ya conocidos). Omitido si
 *                     la clase no lo permite, es el nivel 1 o no hay conjuros que sustituir.
 *                   properties:
 *                     choose:
 *                       type: integer
 *                       minimum: 1
 *                     from:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Spell'
 *                     to:
 *                       $ref: '#/components/schemas/SpellChoiceApi'
 *                 subclassChoice:
 *                   type: object
 *                   nullable: true
 *                   description: >
 *                     Menú de subclases si el personaje debe elegir en este nivel.
 *                     Incluye name, description, level y options hidratadas. En cada opción,
 *                     `levels[].optionChoices` es `PendingOptionChoice` (opciones del grupo, no solo groupId).
 *                     Nulo si ya tiene subclase o aún no toca elegir.
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
 *                 catalogChoices:
 *                   type: array
 *                   description: >
 *                     Elecciones de catálogo pendientes en rasgos que el personaje ya posee
 *                     o recibe en este nivel, si pertenecen a la clase o subclase que sube
 *                     y su concesión llega en este nivel de clase o antes.
 *                     add es cuántas opciones hay que añadir. options son las que quedan,
 *                     incluidas las repetibles ya elegidas. chosen son las ya guardadas
 *                     y deben conservarse al frente, con sus textos e idioma.
 *                   items:
 *                     $ref: '#/components/schemas/PendingCatalogChoice'
 *                 damageChoices:
 *                   type: array
 *                   description: >
 *                     Elecciones de daño aún no guardadas de rasgos que este nivel
 *                     concede (stacked.granted). Options hidratadas; con source
 *                     damageTypes, una opción por tipo de daño del sistema y ancestros.
 *                     Se pinta label y se envía name (el id del tipo). Omitido si no hay pendientes.
 *                   items:
 *                     $ref: '#/components/schemas/PendingDamageChoice'
 *                 skillProficiencyChoices:
 *                   type: array
 *                   description: >
 *                     Multiplicador de competencia de este nivel (p. ej. Pericia). add es
 *                     cuántas skills hay que enviar en skillProficiencyPicks. options son
 *                     las competencias que aún no tienen ese multiplicador.
 *                   items:
 *                     $ref: '#/components/schemas/PendingSkillProficiencyChoice'
 *                 skillChoices:
 *                   $ref: '#/components/schemas/SkillChoiceApi'
 *                   description: >
 *                     Habilidades nuevas a elegir en este nivel (clase y subclase ya asignada).
 *                     Distinto de skillProficiencyChoices (multiplicador sobre skills ya competentes).
 *                     Las opciones ya poseídas se recortan. Omitido si no hay elección en este nivel.
 *                 optionChoices:
 *                   type: array
 *                   description: >
 *                     Elecciones de grupos de opciones de este nivel (p. ej. invocaciones)
 *                     de la clase o de una subclase ya asignada. Omitido si aún debe elegir
 *                     subclase: entonces van en `subclassChoice.options[].levels[].optionChoices`.
 *                     choose es cuántas hay que añadir. replace es cuántas se pueden cambiar
 *                     (incluye `optionReplacements` de la clase o subclase si el personaje
 *                     ya tiene opciones de ese grupo). options marca available/unmet según
 *                     requisitos. selected son las ya elegidas.
 *                   items:
 *                     $ref: '#/components/schemas/PendingOptionChoice'
 *                 abilityScore:
 *                   type: boolean
 *                   description: >
 *                     True si este nivel de clase otorga Mejora de característica.
 *                     En ese caso el POST debe enviar `abilityScore` (repartir 2 puntos)
 *                     o `abilityScoreOption` si hay `abilityScoreAlternative`.
 *                 abilityScoreAlternative:
 *                   allOf:
 *                     - $ref: '#/components/schemas/PendingOptionChoice'
 *                   description: >
 *                     Alternativa a la mejora de característica: una opción del grupo
 *                     configurado (`choose` 1). Omitido si el sistema o la clase no definen grupo.
 *                 newClass:
 *                   type: boolean
 *                   description: True si el personaje aún no tiene esta clase (dip de nivel 1).
 *                 requirementsMet:
 *                   type: boolean
 *                   description: >
 *                     Presente en un dip o al continuar una clase si el personaje ya es multiclase.
 *                     False si falta algún requisito (p. ej. Fue 13); el GET igual devuelve 200.
 *                 dip:
 *                   type: object
 *                   description: Solo si `newClass` es true. Competencias y requisitos del dip.
 *                   properties:
 *                     requirements:
 *                       $ref: '#/components/schemas/AttributeRequirements'
 *                     requirementsMet:
 *                       type: boolean
 *                     proficiencies:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Competencias fijas concedidas por el dip (sin duplicar las ya poseídas en el POST).
 *                     skillChoices:
 *                       type: object
 *                       description: Elección de habilidades con las opciones ya poseídas recortadas.
 *                     proficiencyChoices:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Elecciones de competencias con las opciones ya poseídas recortadas.
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
router.get('/character/:id/level-up-data', authMiddleware, validateParams(CharacterIdParamsSchema), validateQuery(LevelUpDataQuerySchema), characterController.getLevelUpData);

/**
 * @openapi
 * /character/{id}/level-up:
 *   post:
 *     summary: Subir de nivel a un personaje
 *     description: |
 *       Incrementa en 1 el nivel de la clase indicada, o toma una clase nueva (`$push` en `classes[]`
 *       a nivel 1) si no la tenía. Recalcula el bono de competencia según el sistema y aumenta los
 *       puntos de golpe usando `hpLevelUpFormula` del sistema del personaje. El cliente envía solo
 *       el incremento base de PG (`hpIncrease`, resultado de la tirada o media del dado); el tope es
 *       el dado de la clase objetivo (catálogo en dip, entrada de `classes[]` si ya la tiene).
 *       El servidor aplica la fórmula del sistema con los atributos del personaje (tras aplicar la
 *       mejora de característica, si la hay). Reinicia la XP a 0.
 *       En un dip une `multiclass.proficiencies` y aplica `proficiencyPicks`; no toca
 *       tiradas de salvación ni equipo. Rechaza (400) si faltan requisitos de todas las clases implicadas.
 *       `skillPicks` cubre el dip y las `skillChoices` del nivel (clase o subclase, incluida la
 *       enviada en `subclass` en el mismo POST). `proficiencyPicks` solo aplica al tomar una clase nueva.
 *       Si `GET /character/{id}/level-up-data` devolvió `spellChoices`, el body debe incluir
 *       `spells` (array de arrays, mismo orden y `choose` que cada elección). Los conjuros se
 *       guardan en `spells[classId]`.
 *       Si el GET devolvió `spellChanges`, el body puede incluir `spellReplacements` (0..`choose`
 *       pares `{ from, to }`). Es opcional: omitir o enviar vacío no sustituye. `from` debe estar
 *       en `spellChanges.from`; `to` en `spellChanges.to` y no puede ser un conjuro ya conocido
 *       ni uno de `spells` de esta misma subida. El recambio se aplica sobre los conocidos y se
 *       quita `from` de `preparedSpells` de esa clase si estaba preparado.
 *       Aplica los rasgos automáticos del nivel (`traits` y
 *       `traitsData`) al personaje.
 *       Si un rasgo nuevo define `damageChoices`, el body debe incluir `traitChoices` con
 *       esa elección. Si ya estaba guardada, se puede omitir o repetir los mismos nombres.
 *       Si `catalogChoices` trae elecciones pendientes, `traitChoices` debe enviar la lista
 *       completa: lo ya elegido, en el mismo orden, con los mismos textos e idioma, y exactamente
 *       `add` opciones nuevas. Una opción no repetible no se elige dos veces. Cada texto libre
 *       tiene entre 1 y 80 caracteres y no se repite en esa elección. Si la elección admite idioma,
 *       `languageId` es un idioma de los sistemas del personaje; null solo vale si el idioma es
 *       optional. Si no hay nada pendiente, se omite o se repite la misma lista. Quitar o cambiar
 *       una opción ya elegida se rechaza.
 *       El nivel que abre la concesión es el de esa clase, no el nivel total del personaje.
 *       Si el GET devolvió `abilityScore: true`, el body debe incluir exactamente uno de
 *       `abilityScore` (repartir 2 puntos: un +2 o dos +1) o `abilityScoreOption` (ObjectId de
 *       una opción de `abilityScoreAlternative`). La opción se aplica como el resto de
 *       `optionPicks` (trait, requisitos, `optionSelections`).
 *       El tope de cada característica es el `max` de los rasgos ya poseídos o, si no hay,
 *       `defaultMaxAttributeValue`. Se valida la puntuación final (guardada + bono de rasgo + ASI).
 *       Un +CON de ASI afecta el PG de este
 *       nivel, no de los anteriores. Un rasgo con abilityScores de Constitución sí suma el salto de
 *       modificador a los PG de los niveles previos.
 *       Si el GET devolvió `subclassChoice`, el body debe incluir `subclass` (ObjectId de la subclase).
 *       Si el GET devolvió `optionChoices` en la raíz, o la subclase enviada tiene `optionChoices`
 *       en este nivel (`subclassChoice.options[].levels[]`), el body debe incluir `optionPicks`
 *       con un elemento por grupo: `add` tiene longitud `choose` y `replace` como máximo `replace`
 *       (el `replace` del GET ya incluye `optionReplacements` de clase o subclase). Cada id debe
 *       pertenecer al grupo, cumplir requisitos y no estar ya elegida salvo que sea repetible.
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
 *                 description: ID de MongoDB de la clase en la que se sube de nivel. Puede ser una clase nueva.
 *               hpIncrease:
 *                 type: integer
 *                 minimum: 1
 *                 description: |
 *                   Incremento base de PG (tirada o media del dado de golpe). Se inyecta en
 *                   la fórmula del sistema como `@class.hitDie` y `@hpIncrease`.
 *               spells:
 *                 type: array
 *                 description: |
 *                   Elecciones de conjuros alineadas con `spellChoices` del GET level-up-data.
 *                   `spells[i]` son los IDs elegidos para `spellChoices[i]` (misma longitud que `choose`).
 *                   Obligatorio si hay elecciones; omitir o enviar vacío si no las hay.
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *                     description: ObjectId de MongoDB del conjuro.
 *               spellReplacements:
 *                 type: array
 *                 description: |
 *                   Recambio opcional alineado con `spellChanges` del GET level-up-data.
 *                   Cada elemento sustituye `from` por `to`. Longitud entre 0 y `choose`.
 *                   Si el GET no devolvió `spellChanges`, no enviar recambios.
 *                 items:
 *                   type: object
 *                   required:
 *                     - from
 *                     - to
 *                   properties:
 *                     from:
 *                       type: string
 *                       description: ObjectId del conjuro conocido que se deja.
 *                     to:
 *                       type: string
 *                       description: ObjectId del conjuro de la lista de la clase que se aprende.
 *               optionPicks:
 *                 type: array
 *                 description: >
 *                   Elecciones de grupos de opciones alineadas con `optionChoices` del GET
 *                   (raíz o `levels[].optionChoices` de la subclase enviada en `subclass`).
 *                   `add` tiene la misma longitud que `choose`. `replace` es opcional (0..replace).
 *                 items:
 *                   type: object
 *                   required:
 *                     - groupId
 *                     - add
 *                   properties:
 *                     groupId:
 *                       type: string
 *                     add:
 *                       type: array
 *                       items:
 *                         type: string
 *                     replace:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - from
 *                           - to
 *                         properties:
 *                           from:
 *                             type: string
 *                           to:
 *                             type: string
 *               subclass:
 *                 type: string
 *                 description: >
 *                   ObjectId de la subclase elegida. Obligatorio si el GET level-up-data
 *                   devolvió `subclassChoice`. Si el personaje ya la eligió en la creación, omitir.
 *               abilityScore:
 *                 type: object
 *                 description: >
 *                   Incrementos de característica (suma total 2). Mutuamente excluyente con `abilityScoreOption`.
 *                   Obligatorio si `abilityScore` es true y no se envía `abilityScoreOption`.
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
 *               abilityScoreOption:
 *                 type: string
 *                 description: >
 *                   ObjectId de la opción elegida en lugar de los +2. Mutuamente excluyente con
 *                   `abilityScore`. Debe estar en `abilityScoreAlternative.options` del GET.
 *               traitChoices:
 *                 type: object
 *                 description: >
 *                   Elecciones de los rasgos de esta subida.
 *                   Clave exterior: id del rasgo. Clave interior: choiceKey.
 *                   Con damageChoices, la lista de nombres tiene longitud igual a choose
 *                   y es obligatoria si el rasgo es nuevo.
 *                   Con catalogChoices, la lista completa es obligatoria cuando
 *                   level-up-data devuelve esa elección en catalogChoices: conserva chosen
 *                   y añade `add` opciones. Una opción simple es un string; si pide textos
 *                   o idioma, es un objeto. Si no falta ninguna, se puede omitir o repetir
 *                   la lista guardada.
 *                 additionalProperties:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       oneOf:
 *                         - type: string
 *                         - $ref: '#/components/schemas/CatalogChoiceEntry'
 *               skillPicks:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: >
 *                   Habilidades nuevas elegidas en esta subida. Cubre el dip (`dip.skillChoices`)
 *                   y las de nivel (`skillChoices` de clase/subclase, incluida la subclase enviada
 *                   en `subclass`). Longitud igual a la suma de `choose`. Omitir si no hay elección.
 *               skillProficiencyPicks:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: >
 *                   Skills de este nivel que reciben el multiplicador de skillProficiencyChoices.
 *                   Longitud igual a la suma de add. Solo competencias; no repetir las que ya
 *                   tienen ese valor o uno mayor. Omitir si no hay elección.
 *               proficiencyPicks:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: string
 *                 description: >
 *                   Competencias elegidas en un dip. `proficiencyPicks[i]` corresponde a
 *                   `dip.proficiencyChoices[i]` (misma longitud que `choose`).
 *     responses:
 *       200:
 *         description: Personaje actualizado tras la subida de nivel (`full` es la vista sheet, no el catálogo recursivo).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - full
 *                 - basic
 *               properties:
 *                 full:
 *                   $ref: '#/components/schemas/CharacterSheet'
 *                 basic:
 *                   $ref: '#/components/schemas/CharacterBasic'
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
router.post('/character/:id/level-up', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(LevelUpSchema), characterController.levelUp);

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
 *         description: Slice de conjuros (`spells` y `spellsById`) para fusionar en la ficha.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterSpellStateResponse'
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
router.put('/character/:id/prepared-spells', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(PrepareSpellsSchema), characterController.prepareSpells);

/**
 * @openapi
 * /character/{id}/spell-privileges/{traitId}:
 *   put:
 *     summary: Vincular conjuros a un rasgo con privilegio de conjuro
 *     description: |
 *       Sustituye la elección de conjuros vinculada a un rasgo del personaje (p. ej. Maestría
 *       sobre Conjuros, Conjuros característicos o Arcanum Místico).
 *       El rasgo debe definir `spellPrivileges`. Cada grupo de `selections` corresponde a una
 *       regla **activa** (`atLevel` menor o igual al nivel de la clase indicada) y debe tener
 *       exactamente `choose` conjuros del nivel indicado, de la lista de la clase.
 *       Si `source` es `known`, deben estar entre los conocidos de esa clase.
 *       Si `source` es `anyClassList`, cada conjuro debe pertenecer a alguna lista de clase.
 *       El primer vínculo de cada regla está permitido. Añadir grupos de reglas que acaban de
 *       desbloquearse también lo está, aunque `replace` sea nulo. Cambiar un grupo ya guardado
 *       solo se admite si esa regla tiene `replace` (p. ej. 8 horas de estudio).
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
 *         description: Slice de conjuros y privilegios para fusionar en la ficha.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterSpellStateResponse'
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
router.put('/character/:id/spell-privileges/:traitId', authMiddleware, validateParams(BindSpellPrivilegesParamsSchema), validateSchema(BindSpellPrivilegesSchema), characterController.bindSpellPrivileges);

/**
 * @openapi
 * /character/{id}/traits/{traitId}/use:
 *   post:
 *     summary: Usar la acción de un rasgo
 *     description: |
 *       Compara `spent` de `traitResources` con `traits[].action.uses` (resuelto con
 *       `usesByClassLevel` y el nivel de la clase otorgante). Si no quedan usos, 400.
 *       Incrementa `spent`. Si `action.kind` es stance, añade el id a `activeTraitIds`
 *       (400 si ya estaba activa). Falla si `suppressedByArmorTypeIds` coincide con
 *       armadura equipada. `uses: unlimited` no incrementa `spent`. No recarga PG.
 *       Si `action.recoverSpellSlots` está definido, recupera las ranuras gastadas de
 *       esa bolsa (`standard` o `fixedLevel`) en la clase otorgante. Sin clase otorgante
 *       el uso se gasta igual y las ranuras no cambian.
 *       Si el rasgo tiene `weaponBond`, invoca o materializa el arma vinculada. Con un arma
 *       vinculada guardada ignora `equipmentId`. Si no hay vínculo, `equipmentId` es la forma
 *       (arma cuerpo a cuerpo del catálogo). No se equipa. Un arma vinculada ya manifiesta responde 400.
 *       Si el rasgo tiene `uniqueEquipmentGrant`, realiza la ceremonia: destruye cualquier
 *       instancia única concedida y crea una nueva desde `uniqueEquipmentGrant.id`. No usa `equipmentId`
 *       del body. La acción suele ser `uses: unlimited`.
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
 *         description: ID del rasgo.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               equipmentId:
 *                 type: string
 *                 description: ID de MongoDB del arma de catálogo que adopta el arma vinculada invocada.
 *     responses:
 *       200:
 *         description: Parche con traitResources, activeTraitIds y, si aplica, ranuras, inventario y overlays de combate.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: Sin usos, stance ya activa, rasgo sin acción, suprimido por armadura o arma vinculada inválida.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje o rasgo no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/traits/:traitId/use', authMiddleware, validateParams(BindSpellPrivilegesParamsSchema), validateSchema(UseTraitSchema), characterController.useTrait);

/**
 * @openapi
 * /character/{id}/traits/{traitId}/deactivate:
 *   post:
 *     summary: Apagar la stance o descartar el arma vinculada
 *     description: |
 *       Si el rasgo tiene `weaponBond` y hay un arma manifiesta, la descarta: borra
 *       una invocada o guarda en extradimensional (`bondStored`) una vinculada.
 *       Si no, quita el rasgo de `activeTraitIds` (y `traits[].action.active` pasa a false).
 *       No modifica `traitResources[].spent` ni `action.remaining`.
 *       Falla si no hay arma manifiesta ni stance activa.
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
 *         description: ID del rasgo.
 *     responses:
 *       200:
 *         description: Personaje actualizado con la stance apagada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: El rasgo no estaba activo.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/traits/:traitId/deactivate', authMiddleware, validateParams(BindSpellPrivilegesParamsSchema), characterController.deactivateTrait);

/**
 * @openapi
 * /character/{id}/rest:
 *   post:
 *     summary: Descanso (usos de rasgos)
 *     description: |
 *       `type` debe ser una clave de `restRules.kinds` del ruleset del personaje.
 *       Si el sistema no define `restRules`, o `type` no está en el catálogo, responde 400.
 *       Mira `traits[].action.recharge` de cada rasgo. Si el descanso cubre esa clave
 *       (igualdad o `includes` transitivo), pone `traitResources[].spent` a 0
 *       (y `action.remaining` vuelve al máximo).
 *       Vacía `activeTraitIds` solo si `restRules.endStancesOn` cubre el `type`
 *       (directo o por `includes`). Si `endStancesOn` se omite, las stances se conservan.
 *       `traitChoices` es opcional: solo admite claves de daño con `replaceOn` compatible
 *       con el descanso. Si se omite, se conserva la elección anterior.
 *       Si `hitDiceSpending.on` incluye el `type` (coincidencia exacta), `hitDiceSpends`
 *       gasta dados y suma PG **antes** de `hitPointRecovery`. Cada entrada es
 *       `{ classId, count, hpGained }` como en POST `/character/{id}/hit-dice/spend`.
 *       Si el array llega y el `type` no está en `on`, responde 400.
 *       Si `hitPointRecovery` cubre el `type`, aplica `hp` (`full` pone hpCurrent a hpMax)
 *       y `hitDice` (`all` o `half` de los dados totales, mínimo 1, restando spent por clase
 *       en el orden de `classes`). Fuera de un descanso, el gasto de dados es
 *       POST `/character/{id}/hit-dice/spend`.
 *       Si `spellSlotRecovery` cubre el `type`, pone a 0 el spent de las bolsas listadas
 *       (`standard` y/o `fixedLevel`). El gasto de ranuras es POST `/character/{id}/spell-slots/spend`.
 *       A cada `activeConditions` cuyo `Condition.recovery` cubra el `type` le aplica la suma
 *       de `delta`; si el nivel baja de 1, quita el estado.
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
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 description: Clave de `restRules.kinds` del sistema del personaje.
 *               traitChoices:
 *                 type: object
 *                 description: >
 *                   Recambio opcional de elecciones de daño con replaceOn. La clave
 *                   exterior es el id del rasgo y la interior la clave de la elección.
 *                   La lista tiene tantos nombres (ids de tipo de daño) como indique choose.
 *               hitDiceSpends:
 *                 type: array
 *                 description: >
 *                   Gastos de dados de golpe durante este descanso. Solo si
 *                   `restRules.hitDiceSpending.on` incluye `type`.
 *                 items:
 *                   type: object
 *                   required:
 *                     - classId
 *                     - count
 *                     - hpGained
 *                   properties:
 *                     classId:
 *                       type: string
 *                     count:
 *                       type: integer
 *                       minimum: 1
 *                     hpGained:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Parche de recursos (PG, dados, ranuras, rasgos, estados) y overlays de combate. No incluye el catálogo de conjuros.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: El sistema no define descansos o el tipo no está en restRules.kinds.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/rest', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(CharacterRestSchema), characterController.restCharacter);

/**
 * @openapi
 * /character/{id}/hit-dice/spend:
 *   post:
 *     summary: Gastar dados de golpe
 *     description: |
 *       El cliente tira los dados. El cuerpo indica `classId`, `count` y `hpGained`.
 *       Valida que queden dados de esa clase (`level - spent`) y que `hpGained` no supere
 *       `count * (hitDie + bonusPerDie)`. `bonusPerDie` sale de
 *       `restRules.hitDiceSpending.bonusFormula` (0 si se omite).
 *       Suma `hpGained` a `hpCurrent` y recorta a `hpMax`. Incrementa `hitDice[].spent`.
 *       No exige un descanso en curso.
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
 *               - classId
 *               - count
 *               - hpGained
 *             properties:
 *               classId:
 *                 type: string
 *                 description: ID de la clase cuyos dados se gastan.
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 description: Dados a gastar.
 *               hpGained:
 *                 type: integer
 *                 minimum: 0
 *                 description: PG recuperados (tirada del cliente más modificador).
 *     responses:
 *       200:
 *         description: Personaje actualizado tras gastar dados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: Sin dados, PG por encima del máximo o clase inexistente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/hit-dice/spend', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(SpendHitDiceSchema), characterController.spendHitDice);

/**
 * @openapi
 * /character/{id}/hp/damage:
 *   post:
 *     summary: Aplicar daño a los puntos de golpe actuales
 *     description: |
 *       Resta `amount` a `hpCurrent` del personaje. El cliente ya calculó el daño
 *       (resistencias, inmunidades y vulnerabilidades no se aplican aquí).
 *       Si `amount` supera los PG actuales, `hpCurrent` queda en 0. No lanza error
 *       por exceso. No aplica PG temporales ni salvaciones contra muerte.
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Puntos de golpe a restar.
 *     responses:
 *       200:
 *         description: Personaje actualizado tras el daño.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: Cantidad inválida.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/hp/damage', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(ApplyCharacterHpSchema), characterController.applyHpDamage);

/**
 * @openapi
 * /character/{id}/hp/heal:
 *   post:
 *     summary: Curar puntos de golpe actuales
 *     description: |
 *       Suma `amount` a `hpCurrent` y recorta al `hpMax` persistido. Superar el
 *       máximo no es error. No gasta dados de golpe ni aplica reglas de descanso.
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Puntos de golpe a recuperar.
 *     responses:
 *       200:
 *         description: Personaje actualizado tras la curación.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: Cantidad inválida.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/hp/heal', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(ApplyCharacterHpSchema), characterController.applyHpHeal);

/**
 * @openapi
 * /character/{id}/spell-slots/spend:
 *   post:
 *     summary: Gastar una ranura de conjuro
 *     description: |
 *       El cuerpo indica `classId`, `pool` (`standard` o `fixedLevel`) y `level`.
 *       Gasta 1 ranura de esa bolsa. En `fixedLevel`, `level` es el de la bolsa
 *       (el de `fixedLevelSlots.level`), no el del conjuro lanzado.
 *       Valida que queden ranuras (`total - spent`). Incrementa `spellSlots[].spent`.
 *       No exige un descanso en curso.
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
 *               - classId
 *               - pool
 *               - level
 *             properties:
 *               classId:
 *                 type: string
 *                 description: ID de la clase cuyas ranuras se gastan.
 *               pool:
 *                 type: string
 *                 enum: [standard, fixedLevel]
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 9
 *                 description: Nivel de la ranura (o de la bolsa uniforme).
 *     responses:
 *       200:
 *         description: Personaje actualizado tras gastar la ranura.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: Sin ranuras, bolsa inexistente o datos inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/spell-slots/spend', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(SpendSpellSlotSchema), characterController.spendSpellSlot);

/**
 * @openapi
 * /character/{id}/conditions:
 *   post:
 *     summary: Aplicar un estado al personaje
 *     description: |
 *       Añade el estado a `activeConditions`. Si el catálogo tiene niveles, suma `level`
 *       (por defecto 1) y recorta al máximo de la tabla. Si no tiene niveles y ya está
 *       activo, responde 400. Rechaza inmunidades de rasgos y de stances activas.
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
 *               - conditionId
 *             properties:
 *               conditionId:
 *                 type: string
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 description: Niveles a sumar (estados escalonados). Por defecto 1.
 *     responses:
 *       200:
 *         description: Personaje actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: Inmune, duplicado o estado fuera de los sistemas del personaje.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje o estado no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/conditions', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(ApplyCharacterConditionSchema), characterController.applyCharacterCondition);

/**
 * @openapi
 * /character/{id}/conditions/{conditionId}:
 *   patch:
 *     summary: Cambiar el nivel de un estado activo
 *     description: |
 *       Suma `delta` al nivel. Si baja de 1, quita el estado. En estados sin niveles,
 *       un `delta` negativo los quita.
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
 *       - in: path
 *         name: conditionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delta
 *             properties:
 *               delta:
 *                 type: integer
 *                 description: Cambio de nivel. No puede ser 0.
 *     responses:
 *       200:
 *         description: Personaje actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: El personaje no tiene el estado o el delta no es válido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje o estado no encontrado.
 *       500:
 *         description: Error del servidor.
 *   delete:
 *     summary: Quitar un estado activo
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
 *       - in: path
 *         name: conditionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personaje actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: El personaje no tiene este estado.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.patch('/character/:id/conditions/:conditionId', authMiddleware, validateParams(CharacterConditionParamsSchema), validateSchema(UpdateCharacterConditionSchema), characterController.updateCharacterCondition);
router.delete('/character/:id/conditions/:conditionId', authMiddleware, validateParams(CharacterConditionParamsSchema), characterController.removeCharacterCondition);

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
 *         description: Slice de conjuros (`spells` y `spellsById`) para fusionar en la ficha.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterSpellStateResponse'
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
router.post('/character/:id/known-spells', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(LearnSpellsSchema), characterController.learnSpells);

/**
 * @openapi
 * /character/{id}/copied-spells:
 *   post:
 *     summary: Copiar conjuros a un repositorio
 *     description: |
 *       Copia conjuros fuera de la subida de nivel. Sin `traitId` usa `spellRepository` de la clase
 *       (libro de mago: lista de la clase, conocidos, nivel con ranura). Con `traitId` usa el
 *       `spellRepository` del rasgo (p. ej. Libro de Secretos Ancestrales: rituales de cualquier
 *       lista, extra, mitad del nivel de clase).
 *       No descuenta oro ni registra horas: el cliente aplica `copy` del repositorio.
 *       Si `equipmentId` está definido, el personaje debe tener ese objeto en el inventario.
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
 *                 description: ID de MongoDB de la clase asociada al repositorio.
 *               spells:
 *                 type: array
 *                 minItems: 1
 *                 description: IDs de los conjuros a copiar.
 *                 items:
 *                   type: string
 *               traitId:
 *                 type: string
 *                 description: ID del rasgo cuyo spellRepository se usa. Si falta, se usa el de la clase.
 *     responses:
 *       200:
 *         description: Slice de conjuros (`spells` y `spellsById`) para fusionar en la ficha.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterSpellStateResponse'
 *       400:
 *         description: Datos inválidos, sin repositorio, ritual, tope de nivel o objeto ausente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje, rasgo o clase no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/copied-spells', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(CopySpellsSchema), characterController.copySpells);
/**
 * @openapi
 * /character/{id}/addForm:
 *   post:
 *     summary: Añadir una forma de criatura desde un conjuro
 *     description: |
 *       Elige una criatura del `creatureForm` del conjuro y la guarda en `forms`.
 *       Si el personaje tiene rasgos con `creatureFormExtensions` para ese conjuro,
 *       también valen las criaturas de esos pools extra (unión OR).
 *       Si `replaceOnRecast` es true, sustituye las formas previas de ese conjuro.
 *       Si no, rechaza al superar `choose`. `companion` no activa overlay;
 *       `self` y `target` no se activan solas (use POST .../forms/{formId}/activate).
 *       Un filtro sin criterios admite cualquier criatura del sistema del conjuro (y ancestros).
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
 *               - creatureId
 *               - spellId
 *             properties:
 *               creatureId:
 *                 type: string
 *                 description: ID de la criatura elegida.
 *               spellId:
 *                 type: string
 *                 description: ID del conjuro que define el pool de formas.
 *     responses:
 *       200:
 *         description: Parche con forms (criatura resumida) y activeFormId. Solo incluye CA/PG/atributos si el recast cambia la forma overlay activa.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: El conjuro no define formas o la criatura no está en el pool.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje, conjuro o criatura no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/addForm', authMiddleware, validateParams(CharacterIdParamsSchema), validateSchema(AddCharacterFormSchema), characterController.addForm);

/**
 * @openapi
 * /character/{id}/forms/{formId}/activate:
 *   post:
 *     summary: Activar una forma propia o de objetivo
 *     description: |
 *       Solo `purpose: self` o `target`. Aplica overlay de estadísticas de la criatura al leer la ficha
 *       (tamaño, velocidad, CA, PG, atributos coincidentes, resistencias e inmunidades a estados).
 *       `companion` no se puede activar.
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
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la instancia de forma.
 *     responses:
 *       200:
 *         description: Parche con activeFormId, forms resumidas y overlays de combate de la criatura.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: La forma no es propia o ya está activa.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje o forma no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/forms/:formId/activate', authMiddleware, validateParams(CharacterFormParamsSchema), characterController.activateForm);

/**
 * @openapi
 * /character/{id}/forms/{formId}/deactivate:
 *   post:
 *     summary: Desactivar la forma propia activa
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
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la instancia de forma.
 *     responses:
 *       200:
 *         description: Parche con activeFormId nulo, forms resumidas y estadísticas de ficha (sin overlay).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterStatePatch'
 *       400:
 *         description: La forma no está activa.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Sin permiso para modificar este personaje.
 *       404:
 *         description: Personaje o forma no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post('/character/:id/forms/:formId/deactivate', authMiddleware, validateParams(CharacterFormParamsSchema), characterController.deactivateForm);

export default router;