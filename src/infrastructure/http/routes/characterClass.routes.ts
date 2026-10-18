import { Router } from "express";
import { characterClassController, authMiddleware } from "../../dependencies";
import { validateSchema, validateQuery } from "../middlewares/validateSchema";
import {
  CreateCharacterClassSchema,
  UpdateCharacterClassSchema,
  GetCharacterClassesQuerySchema,
  GetCharacterClassCatalogQuerySchema,
  GetCharacterClassByIdQuerySchema
} from "../schemas/characterClass.schema";

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
 *           $ref: '#/components/schemas/SkillChoiceApi'
 *           description: Elección de habilidades hidratada (choose, options y query_type all/options/filter).
 *         multiclass:
 *           $ref: '#/components/schemas/CharacterClassMulticlass'
 *           description: Datos de dip (requisitos y competencias recortadas). No reutiliza las de clase inicial.
 *         spells:
 *           type: array
 *           items:
 *             type: object
 *           description: Conjuros pertenecientes a la clase.
 *         spell_choices:
 *           type: array
 *           items:
 *             type: object
 *           description: Opciones de conjuros a elegir. Si la clase tiene tope de trucos (cantrips) y no hay una choice persistida de nivel 0, se añade una elección sintetizada. Si el nivel 1 tiene `spellsLearned` y ranuras, se añade una elección de conjuros de la clase de los niveles que puede lanzar.
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
 *           description: Opciones de equipamiento inicial resueltas (options, filter o mixed con ramas item/choice/bundle).
 *         spellcasting:
 *           $ref: '#/components/schemas/Attribute'
 *           description: Característica principal para lanzar conjuros de la clase (atributo hidratado).
 *         spellSaveDcFormula:
 *           type: string
 *           description: >
 *             Fórmula de CD de salvación de conjuros.
 *             Tokens permitidos incluyen `@spellcasting.modifier`, `@spellcasting.value`,
 *             `@proficiencyBonus` y `@attributes.{key}.modifier`.
 *             Ejemplo: 8 + @proficiencyBonus + @spellcasting.modifier
 *         spellAttackBonusFormula:
 *           type: string
 *           description: >
 *             Fórmula del modificador de ataque de conjuros.
 *             Ejemplo: @proficiencyBonus + @spellcasting.modifier
 *         spellsPreparedFormula:
 *           type: string
 *           description: >
 *             Fórmula del número de conjuros que la clase puede preparar.
 *             Debe enviarse junto con `preparedFrom`.
 *             Tokens permitidos incluyen `@class.level`, `@spellcasting.modifier` y `@proficiencyBonus`.
 *             Ejemplo: @class.level + @spellcasting.modifier
 *         preparedFrom:
 *           type: string
 *           enum: [known, classList]
 *           description: >
 *             Origen de los conjuros preparables. `known` (p. ej. mago) exige que estén
 *             en los conjuros conocidos de esa clase; `classList` (p. ej. clérigo) permite
 *             elegir de la lista de conjuros de la clase.
 *         spellRepository:
 *           $ref: '#/components/schemas/SpellRepositoryConfig'
 *           description: >
 *             Configuración del repositorio de conjuros copiable (p. ej. libro de conjuros).
 *             Si está presente, el cliente puede mostrar la acción de copiar o aprender
 *             conjuros fuera de la subida de nivel.
 *         spellReplacement:
 *           $ref: '#/components/schemas/SpellReplacementConfig'
 *           description: >
 *             Si está presente, al subir de nivel en esta clase se puede sustituir hasta
 *             `count` conjuros conocidos por otros de la lista de la clase (p. ej. bardo).
 *         levels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterClassLevelInput'
 *           description: Niveles slim para el editor (level, ranuras de conjuro, conjuros aprendidos, elecciones de conjuros, traits y traits_data).
 *         abilityScoreProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: |
 *             Override de niveles de clase con Mejora de característica.
 *             Si se omite, se usa el default del sistema. Array vacío desactiva la mejora en esta clase.
 *         subclassChoice:
 *           $ref: '#/components/schemas/SubclassChoiceConfig'
 *           description: Tipo de elección de subclase (nombre del grupo, texto y nivel en el que se elige).
 *         subclasses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubclassSummary'
 *           description: Subclases ligeras de esta clase (sin rasgos ni niveles hidratados).
 *         god:
 *           type: boolean
 *           description: Indica si la clase exige elegir una deidad.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico.
 *     CharacterClassSummary:
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
 *           description: Primer párrafo de la descripción, recortado a unos 200 caracteres.
 *         ruleset:
 *           type: string
 *         hit_die:
 *           type: integer
 *         hasSpellcasting:
 *           type: boolean
 *           description: True si la clase tiene característica de lanzamiento persistida.
 *         subclassChoice:
 *           type: object
 *           nullable: true
 *           properties:
 *             name:
 *               type: string
 *             level:
 *               type: integer
 *         subclassCount:
 *           type: integer
 *           description: Número de subclases no borradas en el árbol de sistemas consultado.
 *     CharacterClassCatalogItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         ruleset:
 *           type: string
 *         multiclass:
 *           type: object
 *           properties:
 *             requirements:
 *               $ref: '#/components/schemas/FeatRequirements'
 *           description: Solo se incluye con include=multiclass.
 *     SubclassSummary:
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
 *         ruleset:
 *           type: string
 *         classId:
 *           type: string
 *     CharacterClassDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/CharacterClass'
 *     ClassSpellSlots:
 *       type: object
 *       properties:
 *         cantrips:
 *           type: integer
 *           minimum: 0
 *           description: Número de trucos conocidos a ese nivel.
 *         spellsLearned:
 *           type: integer
 *           minimum: 0
 *           description: >
 *             Número de conjuros de nivel 1+ que se aprenden al ganar ese nivel de clase
 *             (no se hereda de niveles anteriores). Si hay ranuras, se sintetiza una
 *             elección de conjuros de la clase y de los niveles que puede lanzar.
 *         slots:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *             minimum: 0
 *           description: Ranuras por nivel de conjuro (clave "1".."9", valor = cantidad).
 *     SubclassChoiceConfig:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - level
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del tipo de subclase (p. ej. Tradiciones arcanas).
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Texto de ambientación del tipo de subclase.
 *         level:
 *           type: integer
 *           minimum: 1
 *           description: Nivel de clase en el que se elige la subclase.
 *     CharacterClassLevelInput:
 *       type: object
 *       required:
 *         - level
 *       properties:
 *         level:
 *           type: integer
 *           minimum: 1
 *           description: Nivel de clase.
 *         spellcasting:
 *           $ref: '#/components/schemas/ClassSpellSlots'
 *           description: Tabla de ranuras, trucos y conjuros aprendidos de ese nivel.
 *         spell_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellChoiceMongo'
 *           description: >
 *             Elecciones de conjuros de ese nivel. Además de IDs o filtro, admite
 *             source anyClassList, levels castable e includeCantrips (Secretos Mágicos).
 *             countsTowardKnown false no suma al total de conjuros conocidos.
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *           description: >
 *             IDs de MongoDB de los rasgos otorgados en este nivel de clase.
 *             Si se omite en una actualización, se conservan los traits existentes de ese nivel.
 *         traits_data:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             additionalProperties:
 *               type: string
 *           description: >
 *             Datos dinámicos de rasgos de este nivel (usos, interpolación de texto).
 *             Si se omite en una actualización, se conservan los traits_data existentes de ese nivel.
 *         skill_choices:
 *           nullable: true
 *           description: >
 *             Elección de habilidades concedida al ganar este nivel de clase. Misma forma que ChoiceMongo.
 *             Solo `choose` ofrece todas las habilidades del sistema (y ancestros).
 *             Envíe null en una actualización para borrar la elección de este nivel.
 *             Si se omite, se conserva.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
 *         skillProficiencyChoices:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/LevelSkillProficiencyChoice'
 *           description: >
 *             Elige skills ya competentes y aplica un multiplicador al bonificador
 *             (2 pericia, 3 triple). Envíe null para borrar la elección de este nivel.
 *     SpellChoiceMongo:
 *       type: object
 *       required:
 *         - choose
 *       properties:
 *         choose:
 *           type: integer
 *           minimum: 1
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         filter:
 *           type: object
 *           additionalProperties: true
 *         source:
 *           type: string
 *           enum: [classList, anyClassList]
 *           description: classList es la lista de la clase. anyClassList son conjuros de cualquier clase.
 *         levels:
 *           type: string
 *           enum: [castable]
 *           description: Resuelve los niveles con las ranuras de ese nivel de clase.
 *         includeCantrips:
 *           type: boolean
 *           description: Si levels es castable, incluye trucos (nivel 0).
 *         countsTowardKnown:
 *           type: boolean
 *           description: Si es false, los conjuros van a extraSpells y no cuentan como conocidos.
 *     LevelSkillProficiencyChoice:
 *       type: object
 *       required:
 *         - choose
 *         - value
 *         - from
 *       properties:
 *         choose:
 *           type: integer
 *           minimum: 1
 *         value:
 *           type: number
 *           enum: [0.5, 1, 2, 3]
 *           description: Multiplicador del bonificador de competencia.
 *         from:
 *           type: string
 *           enum: [proficient]
 *           description: Solo skills en las que el personaje ya tiene competencia.
 *     SpellCopyCost:
 *       type: object
 *       required:
 *         - hoursPerSpellLevel
 *         - costPerSpellLevel
 *       properties:
 *         hoursPerSpellLevel:
 *           type: number
 *           minimum: 0
 *           description: Horas de trabajo por cada nivel del conjuro.
 *         costPerSpellLevel:
 *           $ref: '#/components/schemas/EquipmentCost'
 *           description: Coste en monedas por cada nivel del conjuro (cantidad y moneda).
 *     SpellRepositoryConfig:
 *       type: object
 *       required:
 *         - name
 *         - includesCantrips
 *         - copy
 *         - duplicate
 *         - recoverPreparedOnLoss
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del repositorio (p. ej. Libro de conjuros).
 *         equipmentId:
 *           type: string
 *           description: ObjectId del ítem de catálogo que representa el objeto físico (opcional).
 *         includesCantrips:
 *           type: boolean
 *           description: Indica si los trucos se guardan en el repositorio. En el mago es false.
 *         copy:
 *           $ref: '#/components/schemas/SpellCopyCost'
 *           description: Coste de copiar un conjuro hallado (pergamino u otro libro).
 *         duplicate:
 *           $ref: '#/components/schemas/SpellCopyCost'
 *           description: Coste de copiar un conjuro desde el propio repositorio (copia de seguridad).
 *         recoverPreparedOnLoss:
 *           type: boolean
 *           description: Si se pierde el repositorio, se pueden transcribir los conjuros preparados actuales.
 *     SpellReplacementConfig:
 *       type: object
 *       required:
 *         - count
 *       properties:
 *         count:
 *           type: integer
 *           minimum: 1
 *           description: Número máximo de conjuros conocidos que se pueden sustituir al ganar un nivel de esta clase.
 *         includeCantrips:
 *           type: boolean
 *           description: >
 *             Si es true, también se pueden sustituir trucos. Si se omite o es false,
 *             solo conjuros de un nivel para el que la clase tenga espacios.
 *     CharacterClassMulticlass:
 *       type: object
 *       properties:
 *         requirements:
 *           $ref: '#/components/schemas/FeatRequirements'
 *           description: Requisitos de atributo para tomar o mantener esta clase en un personaje multiclase. Hidratados con nombre e icono.
 *         proficiencies:
 *           type: array
 *           items:
 *             type: object
 *           description: Competencias fijas que concede el dip (hidratadas). Distintas de las de clase inicial.
 *         skill_choices:
 *           $ref: '#/components/schemas/SkillChoiceApi'
 *           description: Elección de habilidades del dip hidratada (choose, options y query_type all/options/filter).
 *         proficiencies_choices:
 *           type: array
 *           items:
 *             type: object
 *           description: Elecciones de competencias del dip.
 *     CharacterClassMulticlassInput:
 *       type: object
 *       properties:
 *         requirements:
 *           $ref: '#/components/schemas/FeatRequirementsInput'
 *           description: Requisitos de atributo (misma forma que las dotes).
 *         proficiencies:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de competencias fijas del dip.
 *         skill_choices:
 *           $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           nullable: true
 *           description: Elección de habilidades del dip.
 *         proficiencies_choices:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           description: Elecciones de competencias del dip.
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
 *           nullable: true
 *           description: >
 *             Elección de habilidades. Misma forma que ChoiceMongo.
 *             Solo `choose` ofrece todas las habilidades del sistema (y ancestros).
 *             `options` son identificadores de habilidad. `filter` busca habilidades por criterio.
 *             Envíe null para borrar la elección.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
 *         proficiencies_choices:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Elecciones independientes de competencias (IDs en options o filtro, por ejemplo type o parentProficiencyId). Envíe null para borrar la lista.
 *         multiclass:
 *           $ref: '#/components/schemas/CharacterClassMulticlassInput'
 *           description: Datos de dip. Opcional al crear.
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GrantedEquipmentEntry'
 *           description: Equipamiento fijo inicial.
 *         equipment_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           description: Opciones de equipamiento inicial.
 *         spellcasting:
 *           type: string
 *           nullable: true
 *           description: ObjectId del atributo usado como característica de lanzamiento de conjuros.
 *         spellSaveDcFormula:
 *           type: string
 *           description: Fórmula de CD de salvación de conjuros (ej. 8 + @proficiencyBonus + @spellcasting.modifier).
 *         spellAttackBonusFormula:
 *           type: string
 *           description: Fórmula del modificador de ataque de conjuros (ej. @proficiencyBonus + @spellcasting.modifier).
 *         spellsPreparedFormula:
 *           type: string
 *           description: Fórmula de conjuros preparables (ej. @class.level + @spellcasting.modifier). Debe ir con preparedFrom.
 *         preparedFrom:
 *           type: string
 *           enum: [known, classList]
 *           description: Origen de los conjuros preparables (`known` o `classList`).
 *         spellRepository:
 *           allOf:
 *             - $ref: '#/components/schemas/SpellRepositoryConfig'
 *           nullable: true
 *           description: Configuración del repositorio de conjuros copiable. Opcional al crear.
 *         spellReplacement:
 *           allOf:
 *             - $ref: '#/components/schemas/SpellReplacementConfig'
 *           nullable: true
 *           description: >
 *             Recambio opcional de conjuros conocidos al subir de nivel (p. ej. bardo).
 *             Opcional al crear.
 *         levels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterClassLevelInput'
 *           description: Niveles con tabla de ranuras, elecciones de conjuros, pericia, traits y skill_choices.
 *         abilityScoreProgression:
 *           type: array
 *           items:
 *             type: integer
 *           description: |
 *             Override de niveles con Mejora de característica (reemplazo completo del default del sistema).
 *             Array vacío desactiva la mejora en esta clase. Si se omite, se hereda el default del sistema.
 *         subclassChoice:
 *           allOf:
 *             - $ref: '#/components/schemas/SubclassChoiceConfig'
 *           nullable: true
 *           description: Tipo de elección de subclase. No incluye el catálogo; las subclases se crean en /subclasses.
 *         god:
 *           type: boolean
 *           description: Indica si la clase exige elegir una deidad.
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
 *           nullable: true
 *           description: >
 *             Elección de habilidades. Misma forma que ChoiceMongo.
 *             Solo `choose` ofrece todas las habilidades del sistema (y ancestros).
 *             `options` son identificadores de habilidad. `filter` busca habilidades por criterio.
 *             Envíe null para borrar la elección.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
 *         proficiencies_choices:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/ChoiceMongo'
 *           description: Elecciones independientes de competencias (IDs en options o filtro, por ejemplo type o parentProficiencyId). Envíe null para borrar la lista.
 *         multiclass:
 *           allOf:
 *             - $ref: '#/components/schemas/CharacterClassMulticlassInput'
 *           nullable: true
 *           description: Datos de dip. Enviar null para eliminarlos.
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GrantedEquipmentEntry'
 *           description: Equipamiento fijo inicial.
 *         equipment_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *           description: Opciones de equipamiento inicial.
 *         spellcasting:
 *           type: string
 *           nullable: true
 *           description: ObjectId del atributo usado como característica de lanzamiento de conjuros.
 *         spellSaveDcFormula:
 *           type: string
 *           description: Fórmula de CD de salvación de conjuros (ej. 8 + @proficiencyBonus + @spellcasting.modifier).
 *         spellAttackBonusFormula:
 *           type: string
 *           description: Fórmula del modificador de ataque de conjuros (ej. @proficiencyBonus + @spellcasting.modifier).
 *         spellsPreparedFormula:
 *           type: string
 *           description: Fórmula de conjuros preparables (ej. @class.level + @spellcasting.modifier). Debe ir con preparedFrom.
 *         preparedFrom:
 *           type: string
 *           enum: [known, classList]
 *           description: Origen de los conjuros preparables (`known` o `classList`).
 *         spellRepository:
 *           allOf:
 *             - $ref: '#/components/schemas/SpellRepositoryConfig'
 *           nullable: true
 *           description: Configuración del repositorio de conjuros. Enviar null para eliminarla.
 *         spellReplacement:
 *           allOf:
 *             - $ref: '#/components/schemas/SpellReplacementConfig'
 *           nullable: true
 *           description: Recambio de conjuros conocidos al subir de nivel. Enviar null para eliminarlo.
 *         levels:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CharacterClassLevelInput'
 *           description: >
 *             Niveles con tabla de ranuras, elecciones de conjuros, traits y traits_data;
 *             se fusionan por level. Los traits y traits_data de un nivel solo se sustituyen si el campo viene definido.
 *         abilityScoreProgression:
 *           type: array
 *           items:
 *             type: integer
 *           nullable: true
 *           description: |
 *             Override de niveles con Mejora de característica. Enviar null para volver al default del sistema.
 *             Array vacío desactiva la mejora en esta clase.
 *         subclassChoice:
 *           allOf:
 *             - $ref: '#/components/schemas/SubclassChoiceConfig'
 *           nullable: true
 *           description: Tipo de elección de subclase. Enviar null para eliminarlo.
 *         god:
 *           type: boolean
 *           description: Indica si la clase exige elegir una deidad.
 */

/**
 * @openapi
 * /character-classes:
 *   get:
 *     summary: Obtener el listado ligero de clases
 *     description: >
 *       Devuelve CharacterClassSummary, sin hidratar rasgos, conjuros, equipo ni subclases.
 *       Sin ruleset la respuesta es una lista vacía.
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
 *         description: Listado ligero de clases.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CharacterClassSummary'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/character-classes", authMiddleware, validateQuery(GetCharacterClassesQuerySchema), characterClassController.getClasses);
router.get("/clases", authMiddleware, validateQuery(GetCharacterClassesQuerySchema), characterClassController.getClasses);

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
 *               $ref: '#/components/schemas/CharacterClassDetail'
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
 * /character-classes/catalog:
 *   get:
 *     summary: Obtener el catálogo plano de clases
 *     description: Lista plana (id, name, ruleset) para dropdowns. Con include=multiclass añade requisitos de dip.
 *     tags:
 *       - Clases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema. Incluye clases de ancestros.
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [multiclass]
 *         description: Si es multiclass, añade multiclass.requirements hidratados.
 *     responses:
 *       200:
 *         description: Catálogo obtenido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CharacterClassCatalogItem'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/character-classes/catalog", authMiddleware, validateQuery(GetCharacterClassCatalogQuerySchema), characterClassController.getCatalog);

/**
 * @openapi
 * /character-classes/{id}:
 *   get:
 *     summary: Obtener una clase hidratada por ID
 *     description: >
 *       Devuelve el detalle de la clase (CharacterClassDetail). Las subclases van como
 *       SubclassSummary. Si se indica ruleset, la clase debe pertenecer a ese sistema o a un ancestro.
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
 *         description: ID de la clase.
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema consultado.
 *     responses:
 *       200:
 *         description: Clase obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CharacterClassDetail'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Clase no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get("/character-classes/:id", authMiddleware, validateQuery(GetCharacterClassByIdQuerySchema), characterClassController.getById);

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
 *               $ref: '#/components/schemas/CharacterClassDetail'
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
