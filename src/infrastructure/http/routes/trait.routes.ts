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
 *         resistances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Damage'
 *           description: Resistencias fijas a tipos de daño que otorga el rasgo.
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellPrivilegeRule'
 *           description: >
 *             Reglas de privilegio de conjuro que otorga el rasgo (elección del personaje,
 *             preparados automáticos, lanzamiento sin ranura y sustitución).
 *         speed:
 *           $ref: '#/components/schemas/TraitSpeed'
 *           description: Efecto de velocidad de movimiento que otorga el rasgo.
 *         acFormula:
 *           type: string
 *           nullable: true
 *           description: Fórmula de CA sin armadura (defensa sin armadura).
 *           example: "10 + @attributes.dex.modifier + @attributes.con.modifier"
 *         suppressedByArmorTypeIds:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: IDs de tipos de armadura (del sistema o sus ancestros) que desactivan el rasgo si el personaje lleva una pieza de ese tipo.
 *         ignoresArmorSpeedPenaltyForTypeIds:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: IDs de tipos de armadura (del sistema o sus ancestros) para los que no se resta la penalización de velocidad al no cumplir el atributo mínimo.
 *         equipmentRestriction:
 *           allOf:
 *             - $ref: '#/components/schemas/EquipmentRestriction'
 *           description: >
 *             Restricción de material al equipar. block rechaza el equipado; warn lo
 *             permite para que el cliente avise.
 *         companionRoster:
 *           $ref: '#/components/schemas/TraitCompanionRoster'
 *           description: >
 *             Pista para la UI sobre cuántos compañeros pedir. `count` no se valida
 *             contra la longitud del roster del personaje.
 *         languages:
 *           $ref: '#/components/schemas/TraitLanguages'
 *           description: Idiomas que el rasgo concede de forma fija. No incluye notas ni elecciones.
 *         damageChoices:
 *           type: array
 *           description: >
 *             Catálogo de elecciones de tipo de daño. GET /traits no incluye la fila elegida
 *             por un personaje.
 *           items:
 *             $ref: '#/components/schemas/TraitDamageChoice'
 *         damageChoiceRef:
 *           $ref: '#/components/schemas/TraitDamageChoiceRef'
 *           description: >
 *             El rasgo no redefine la tabla: lee la elección de otro rasgo.
 *             Si grantsResistance es true, la ficha añade esos daños a las resistencias.
 *         damageChoice:
 *           type: array
 *           description: >
 *             Filas resueltas en la ficha del personaje (name y damage).
 *             No aparece en el catálogo. Con varias filas, {name} y {damage} de la
 *             descripción se sustituyen uniéndolos con coma.
 *           items:
 *             $ref: '#/components/schemas/ResolvedDamageChoice'
 *         catalogChoices:
 *           type: array
 *           description: >
 *             Catálogo de elecciones por nombre. El personaje guarda la lista creciente
 *             en traitChoices. Las concesiones dependen del nivel de la clase que otorga
 *             el rasgo, no del nivel total.
 *           items:
 *             $ref: '#/components/schemas/TraitCatalogChoice'
 *         catalogChoice:
 *           type: array
 *           description: >
 *             Opciones elegidas, resueltas en la ficha. No aparece en el catálogo.
 *             Si el rasgo no tiene filas de daño, {name} de la descripción y del resumen
 *             se sustituye por las etiquetas unidas con coma. La etiqueta de una opción
 *             con label es esa plantilla; la de una opción simple es su nombre.
 *             language solo aparece si la elección admite idioma.
 *           items:
 *             $ref: '#/components/schemas/ResolvedCatalogChoice'
 *         hitPoints:
 *           $ref: '#/components/schemas/TraitHitPoints'
 *           description: >
 *             Bono de puntos de golpe por nivel. scope class suma por nivel de la clase
 *             que otorga el rasgo; scope character suma por nivel total del personaje.
 *     EquipmentRestriction:
 *       type: object
 *       required:
 *         - forbiddenMaterials
 *         - scopes
 *         - enforcement
 *       properties:
 *         forbiddenMaterials:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/EquipmentMaterial'
 *           description: Materiales que el rasgo prohíbe equipar.
 *           example: ["metal"]
 *         unlessMaterials:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EquipmentMaterial'
 *           description: Materiales que excepcionan la prohibición, como el mithral.
 *           example: ["mithral"]
 *         scopes:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *             enum: [armor, shield]
 *           description: >
 *             Ámbitos afectados. armor es la ranura armor. shield es la ranura off_hand
 *             cuando el objeto tiene clase de armadura.
 *           example: ["armor", "shield"]
 *         enforcement:
 *           type: string
 *           enum: [block, warn]
 *           description: >
 *             block impide equipar el objeto. warn lo permite y el cliente puede avisar
 *             con el rasgo y los materiales.
 *           example: "block"
 *     TraitHitPoints:
 *       type: object
 *       required:
 *         - perLevel
 *         - scope
 *       properties:
 *         perLevel:
 *           type: integer
 *           minimum: 1
 *           description: Puntos de golpe adicionales por nivel aplicables.
 *         scope:
 *           type: string
 *           enum: [class, character]
 *           description: >
 *             class aplica el bono según los niveles de la clase o subclase que concede el rasgo;
 *             character aplica el bono según el nivel total del personaje.
 *     TraitLanguages:
 *       type: object
 *       properties:
 *         speaks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Language'
 *           description: Idiomas que el personaje pasa a hablar.
 *         understands:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Language'
 *           description: Idiomas que el personaje pasa a entender.
 *     TraitDamageChoice:
 *       type: object
 *       required:
 *         - key
 *         - choose
 *         - options
 *       properties:
 *         key:
 *           type: string
 *           description: Clave única de la elección dentro del rasgo.
 *         choose:
 *           type: integer
 *           minimum: 1
 *           description: Número de filas que el personaje debe elegir. No puede superar las opciones.
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TraitDamageChoiceOption'
 *     TraitDamageChoiceOption:
 *       type: object
 *       required:
 *         - name
 *         - damageTypeId
 *       properties:
 *         name:
 *           type: string
 *           description: >
 *             Nombre único de la fila dentro del rasgo. Es la clave que el personaje
 *             guarda en traitChoices y sustituye {name} en la ficha.
 *         damageTypeId:
 *           type: string
 *           description: ID de MongoDB del tipo de daño. Dos filas pueden compartir el mismo daño.
 *         damage:
 *           $ref: '#/components/schemas/Damage'
 *           description: Tipo de daño hidratado. Sustituye {damage} en la ficha.
 *     TraitCatalogChoice:
 *       type: object
 *       required:
 *         - key
 *         - options
 *         - grants
 *       properties:
 *         key:
 *           type: string
 *           description: Clave única de la elección dentro del rasgo. El personaje la usa en traitChoices.
 *           example: favoredTerrain
 *         language:
 *           type: string
 *           enum: [optional, required]
 *           description: >
 *             Si se omite, la elección no admite idioma. optional permite languageId nulo.
 *             required exige un idioma del catálogo de los sistemas del personaje.
 *         options:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitCatalogOption'
 *         grants:
 *           type: array
 *           minItems: 1
 *           description: >
 *             Cuántas opciones nuevas se eligen al alcanzar cada nivel de la clase.
 *             Los niveles no se repiten. Si ninguna opción es repeatable, la suma de
 *             choose no puede superar las opciones.
 *           items:
 *             type: object
 *             required:
 *               - atLevel
 *               - choose
 *             properties:
 *               atLevel:
 *                 type: integer
 *                 minimum: 1
 *                 description: Nivel de clase en el que se concede la elección.
 *                 example: 1
 *               choose:
 *                 type: integer
 *                 minimum: 1
 *                 description: Opciones nuevas que hay que añadir en ese nivel.
 *                 example: 1
 *     TraitCatalogOption:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre único de la opción. En una opción simple es el valor que se guarda y la etiqueta de la ficha.
 *           example: Bosque
 *         inputs:
 *           type: integer
 *           minimum: 1
 *           description: >
 *             Cuántos textos libres pide esta opción. Si existe, label es obligatorio
 *             y usa {0}, {1}, y así sucesivamente.
 *           example: 2
 *         repeatable:
 *           type: boolean
 *           description: Si es true, la misma opción puede elegirse varias veces. Si se omite, no se repite.
 *         label:
 *           type: string
 *           description: Plantilla de la ficha. Sustituye {0}, {1}, … por los textos libres.
 *           example: "{0} y {1}"
 *     ResolvedCatalogChoice:
 *       type: object
 *       required:
 *         - label
 *       properties:
 *         label:
 *           type: string
 *           description: Nombre de la opción, o la plantilla label con los textos ya sustituidos.
 *           example: Orcos y Trasgos
 *         language:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Language'
 *           description: >
 *             Idioma hidratado. Solo aparece si la elección admite idioma.
 *             Nulo si no hablan o el idioma no está en el catálogo.
 *     TraitDamageChoiceRef:
 *       type: object
 *       required:
 *         - traitId
 *         - choiceKey
 *       properties:
 *         traitId:
 *           type: string
 *           description: ID o index del rasgo que define la tabla.
 *         choiceKey:
 *           type: string
 *           description: Clave de la elección en ese rasgo.
 *         grantsResistance:
 *           type: boolean
 *           description: Si es true, los daños elegidos se unen a las resistencias del personaje.
 *     ResolvedDamageChoice:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre de la fila elegida.
 *         damage:
 *           $ref: '#/components/schemas/Damage'
 *     TraitCompanionRoster:
 *       type: object
 *       required:
 *         - count
 *       properties:
 *         count:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: Orientación de UI (no es una regla de servidor).
 *         suggestedRoles:
 *           type: array
 *           items:
 *             type: string
 *           description: Roles sugeridos; el cliente puede mostrarlos, no son un enumerado.
 *     TraitSpeed:
 *       type: object
 *       description: >
 *         Un rasgo define un único efecto de velocidad. `set` aumenta el modo
 *         hasta el valor indicado (nunca reduce). `add` suma. `equalToWalk`
 *         copia la velocidad de caminar al modo indicado al final.
 *         `condition` por ahora solo admite `always` (o puede omitirse).
 *       properties:
 *         set:
 *           $ref: '#/components/schemas/MovementSpeeds'
 *           description: Aumenta cada modo hasta este valor (por ejemplo, Pies Veloces a 35 pies).
 *         add:
 *           $ref: '#/components/schemas/MovementSpeeds'
 *           description: Suma pies a cada modo indicado.
 *         equalToWalk:
 *           type: array
 *           items:
 *             type: string
 *             enum: [fly, climb, swim, burrow]
 *           description: Tras set y add, esos modos quedan al menos iguales a walk.
 *         condition:
 *           type: string
 *           enum: [always]
 *           description: Condición de aplicación. Por ahora el único valor válido es always.
 *     MovementSpeeds:
 *       type: object
 *       properties:
 *         walk:
 *           type: number
 *           exclusiveMinimum: 0
 *         fly:
 *           type: number
 *           exclusiveMinimum: 0
 *         climb:
 *           type: number
 *           exclusiveMinimum: 0
 *         swim:
 *           type: number
 *           exclusiveMinimum: 0
 *         burrow:
 *           type: number
 *           exclusiveMinimum: 0
 *     SpellPrivilegeRule:
 *       type: object
 *       required:
 *         - choose
 *         - source
 *         - filter
 *         - alwaysPrepared
 *         - countsTowardPreparedCap
 *         - freeCast
 *         - replace
 *       properties:
 *         choose:
 *           type: integer
 *           minimum: 1
 *           description: Número de conjuros que el personaje debe vincular a esta regla.
 *         source:
 *           type: string
 *           enum: [known, classList]
 *           description: >
 *             Origen de los conjuros elegibles. `known` exige que estén en los conocidos
 *             de la clase (p. ej. libro de conjuros); `classList` usa la lista de la clase.
 *         filter:
 *           type: object
 *           required:
 *             - level
 *           properties:
 *             level:
 *               description: Nivel de conjuro exigido (número o lista de niveles).
 *               oneOf:
 *                 - type: integer
 *                   minimum: 0
 *                   maximum: 9
 *                 - type: array
 *                   items:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 9
 *         alwaysPrepared:
 *           type: boolean
 *           description: Si es true, los conjuros vinculados se consideran siempre preparados.
 *         countsTowardPreparedCap:
 *           type: boolean
 *           description: Si es false, no cuentan para el tope de conjuros preparables.
 *         freeCast:
 *           nullable: true
 *           type: object
 *           properties:
 *             slotLevel:
 *               type: string
 *               enum: [spellLevel]
 *               description: El lanzamiento sin ranura usa el nivel del propio conjuro.
 *             uses:
 *               description: Usos sin ranura (`unlimited` o un entero positivo).
 *               oneOf:
 *                 - type: string
 *                   enum: [unlimited]
 *                 - type: integer
 *                   minimum: 1
 *             recharge:
 *               nullable: true
 *               type: string
 *               enum: [shortRest, longRest, shortOrLongRest]
 *               description: Recarga de los usos sin ranura. Nulo si es a voluntad.
 *         replace:
 *           nullable: true
 *           type: object
 *           description: Si está presente, se pueden sustituir los conjuros vinculados.
 *           properties:
 *             hours:
 *               type: number
 *               minimum: 0
 *               description: Horas de estudio que el cliente debe exigir antes de sustituir.
 *             sameLevel:
 *               type: boolean
 *               description: Si el sustituto debe ser del mismo nivel.
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
 *         resistances:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de tipos de daño del sistema o de sus ancestros. Si se omite, queda vacío.
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellPrivilegeRule'
 *           description: Reglas de privilegio de conjuro que otorga el rasgo.
 *         speed:
 *           $ref: '#/components/schemas/TraitSpeed'
 *           description: Efecto de velocidad de movimiento que otorga el rasgo. condition solo admite always.
 *         acFormula:
 *           type: string
 *           nullable: true
 *           description: Fórmula de CA sin armadura.
 *         suppressedByArmorTypeIds:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: IDs de tipos de armadura (del sistema o sus ancestros) que desactivan el rasgo si el personaje lleva una pieza de ese tipo.
 *         ignoresArmorSpeedPenaltyForTypeIds:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: IDs de tipos de armadura (del sistema o sus ancestros) para los que no se resta la penalización de velocidad al no cumplir el atributo mínimo. null borra el campo.
 *         equipmentRestriction:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/EquipmentRestriction'
 *           description: >
 *             Restricción de material al equipar. null borra el campo. block rechaza el
 *             equipado; warn lo permite para que el cliente avise.
 *         companionRoster:
 *           $ref: '#/components/schemas/TraitCompanionRoster'
 *           description: Pista de UI. count no se exige al crear o actualizar el personaje.
 *         languages:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitLanguagesInput'
 *           description: Idiomas concedidos. null borra el campo.
 *         damageChoices:
 *           nullable: true
 *           type: array
 *           description: Tabla de elecciones de daño. null borra el campo.
 *           items:
 *             $ref: '#/components/schemas/TraitDamageChoiceInput'
 *         catalogChoices:
 *           nullable: true
 *           type: array
 *           description: >
 *             Elecciones de catálogo por nombre, con concesiones por nivel de clase.
 *             null borra el campo. Los nombres son únicos, choose es al menos 1
 *             y los niveles de grants no se repiten. Si ninguna opción es repeatable,
 *             la suma de choose no supera las opciones. Una opción con inputs exige label.
 *           items:
 *             $ref: '#/components/schemas/TraitCatalogChoice'
 *         damageChoiceRef:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitDamageChoiceRef'
 *           description: Referencia a la tabla de otro rasgo. null borra el campo.
 *         hitPoints:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitHitPoints'
 *           description: Bono de PG por nivel. null borra el campo.
 *     TraitLanguagesInput:
 *       type: object
 *       properties:
 *         speaks:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs o index de idiomas que el personaje pasa a hablar.
 *         understands:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs o index de idiomas que el personaje pasa a entender.
 *     TraitDamageChoiceInput:
 *       type: object
 *       required:
 *         - key
 *         - choose
 *         - options
 *       properties:
 *         key:
 *           type: string
 *         choose:
 *           type: integer
 *           minimum: 1
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - damageTypeId
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               damageTypeId:
 *                 type: string
 *                 description: ID de MongoDB del tipo de daño del sistema o de un ancestro.
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
 *         resistances:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de tipos de daño del sistema o de sus ancestros. Omitirlo no modifica el valor guardado. Un array vacío borra la lista.
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellPrivilegeRule'
 *           description: Reglas de privilegio de conjuro que otorga el rasgo.
 *         speed:
 *           $ref: '#/components/schemas/TraitSpeed'
 *           description: Efecto de velocidad de movimiento que otorga el rasgo. condition solo admite always.
 *         acFormula:
 *           type: string
 *           nullable: true
 *           description: Fórmula de CA sin armadura.
 *         suppressedByArmorTypeIds:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: IDs de tipos de armadura (del sistema o sus ancestros) que desactivan el rasgo si el personaje lleva una pieza de ese tipo.
 *         ignoresArmorSpeedPenaltyForTypeIds:
 *           type: array
 *           nullable: true
 *           items:
 *             type: string
 *           description: IDs de tipos de armadura (del sistema o sus ancestros) para los que no se resta la penalización de velocidad al no cumplir el atributo mínimo. null borra el campo.
 *         equipmentRestriction:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/EquipmentRestriction'
 *           description: >
 *             Restricción de material al equipar. null borra el campo. block rechaza el
 *             equipado; warn lo permite para que el cliente avise.
 *         companionRoster:
 *           $ref: '#/components/schemas/TraitCompanionRoster'
 *           description: Pista de UI. count no se exige al crear o actualizar el personaje.
 *         languages:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitLanguagesInput'
 *           description: Idiomas concedidos. null borra el campo.
 *         damageChoices:
 *           nullable: true
 *           type: array
 *           description: Tabla de elecciones de daño. null borra el campo.
 *           items:
 *             $ref: '#/components/schemas/TraitDamageChoiceInput'
 *         catalogChoices:
 *           nullable: true
 *           type: array
 *           description: >
 *             Elecciones de catálogo por nombre, con concesiones por nivel de clase.
 *             null borra el campo.
 *           items:
 *             $ref: '#/components/schemas/TraitCatalogChoice'
 *         damageChoiceRef:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitDamageChoiceRef'
 *           description: Referencia a la tabla de otro rasgo. null borra el campo.
 *         hitPoints:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitHitPoints'
 *           description: Bono de PG por nivel. null borra el campo.
 */

/**
 * @openapi
 * /traits:
 *   get:
 *     summary: Obtener rasgos por sistemas
 *     tags:
 *       - Rasgos
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
 *       - Rasgos
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
 *       - Rasgos
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
 *       - Rasgos
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
 *       - Rasgos
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
