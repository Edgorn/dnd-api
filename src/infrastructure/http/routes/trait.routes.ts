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
 *           description: ID de MongoDB del rasgo.
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
 *           description: >
 *             Resumen rápido de los efectos del rasgo. Puede ser un array vacío:
 *             el GET de catálogo no lo rellena desde description. En ficha o PDF,
 *             si está vacío se usa description.
 *         incompatible_traits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Trait'
 *           description: Lista de rasgos incompatibles.
 *         stackGroup:
 *           $ref: '#/components/schemas/TraitStackGroup'
 *           description: >
 *             Grupo de acumulación (p. ej. Defensa sin Armadura exclusive, Ataque Adicional max).
 *             exclusive no se concede si el personaje ya tiene el mismo key; max conserva el rank mayor.
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
 *         conditional_resistances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Damage'
 *           description: Resistencias condicionales (p. ej. mientras estás enfurecido). En GET van hidratadas.
 *         conditionalConditionImmunities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Estado'
 *           description: >
 *             Inmunidades a estados condicionales (p. ej. mientras estás enfurecido).
 *             En GET van hidratadas. En ficha se suman a condition_inmunities si hay
 *             una stance activa del mismo conditionalResistanceGroup.
 *         conditionalResistanceGroup:
 *           type: string
 *           description: >
 *             Nombre de agrupación en la ficha. Varios rasgos con el mismo valor
 *             unen sus resistencias e inmunidades condicionales (p. ej. Furia y
 *             Furia Irracional). Si falta, se usa el nombre del rasgo.
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellPrivilegeRule'
 *           description: >
 *             Reglas de privilegio de conjuro que otorga el rasgo (elección del personaje,
 *             preparados automáticos, lanzamiento sin ranura y sustitución).
 *         innateSpells:
 *           $ref: '#/components/schemas/TraitInnateSpells'
 *           description: >
 *             Magia innata del rasgo (p. ej. Linaje Infernal). Independiente de
 *             spellPrivileges. En GET, ability y cada grant.spell van hidratados.
 *         grantedSpells:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TraitGrantedSpell'
 *           description: >
 *             Conjuros extra fijos (p. ej. Pacto de la Cadena: encontrar familiar).
 *             No cuentan como conocidos. En GET van hidratados. ritualOnly marca
 *             que solo se lanzan como ritual (p. ej. Buscador de Espíritus).
 *         creatureFormExtensions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TraitCreatureFormExtension'
 *           description: >
 *             Amplía el pool de formas de un conjuro que ya define creatureForm
 *             (unión OR con el pool del conjuro).
 *         abilityScores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TraitAbilityScore'
 *           description: >
 *             Bonos de puntuación de característica que aplica el rasgo al leer la ficha
 *             (p. ej. Campeón Primordial: +4 a str y con, máximo 24). No se persisten
 *             en el personaje. max es el tope de esa característica mientras el rasgo esté activo.
 *         skillProficiencies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TraitSkillProficiency'
 *           description: >
 *             Overlay de competencia al leer la ficha. Sube el multiplicador de cada
 *             skill coincidente (0.5, 1 o 2) sin bajar competencia ni pericia.
 *             Sin skillIds ni attributeKeys aplica a todas las skills (p. ej. Aprendiz de Mucho).
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
 *             Filas resueltas en la ficha del personaje (name, label, damage, area y save).
 *             No aparece en el catálogo. Con varias filas, {name}, {damage}, {area} y {save}
 *             de la descripción se sustituyen uniéndolos con coma. {name} usa label.
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
 *         action:
 *           $ref: '#/components/schemas/TraitActionSheet'
 *           description: >
 *             Acción en lectura. Incluye remaining, active y saveDc calculados.
 *             Para POST/PUT use TraitAction (sin esos campos). `{dc}` de la descripción
 *             se sustituye por saveDc. remaining es uses resuelto menos spent.
 *         weaponDamageBonus:
 *           $ref: '#/components/schemas/TraitWeaponDamageBonus'
 *           description: >
 *             Bono de daño a armas mientras el rasgo está activo (p. ej. Furia).
 *             No se aplica en el PDF; solo en la ficha de juego cuando la stance está on.
 *         weaponBond:
 *           $ref: '#/components/schemas/TraitWeaponBond'
 *           description: >
 *             El rasgo invoca o materializa un arma vinculada. Exige action distinta de stance.
 *             POST use crea o saca el arma; POST deactivate la descarta.
 *         uniqueEquipmentGrant:
 *           $ref: '#/components/schemas/TraitUniqueEquipmentGrantApi'
 *           description: >
 *             Objeto único concedido, hidratado en GET (`id` y `name` del catálogo
 *             en el momento de leer). El nombre no se persiste en el rasgo. Si el
 *             equipo se borra, el grant se omite. Exige action distinta de stance.
 *             Al ganar el rasgo se crea el objeto. POST use sustituye esa instancia
 *             (ceremonia) y destruye la anterior. Los trucos de spellPrivileges con
 *             source anyClassList solo salen en spells.extra mientras el personaje
 *             tenga el objeto concedido. En POST/PUT envíe TraitUniqueEquipmentGrant
 *             (`equipmentId`) o null para borrar.
 *         spellRepository:
 *           allOf:
 *             - $ref: '#/components/schemas/SpellRepositoryConfig'
 *           description: >
 *             Repositorio de conjuros del rasgo (p. ej. Libro de Secretos Ancestrales).
 *             El cliente usa copy para horas y oro. POST /character/{id}/copied-spells
 *             con traitId copia según source, destination, ritualOnly y maxLevel.
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
 *       properties:
 *         key:
 *           type: string
 *           description: Clave única de la elección dentro del rasgo.
 *         choose:
 *           type: integer
 *           minimum: 1
 *           description: Número de filas que el personaje debe elegir. Sin source no puede superar las opciones.
 *         source:
 *           type: string
 *           enum:
 *             - damageTypes
 *           description: >
 *             Origen dinámico de las opciones. Con damageTypes se genera una opción
 *             por cada tipo de daño del sistema del personaje y de sus ancestros.
 *             El nombre guardado es el id del tipo. Las options manuales, si se envían,
 *             se añaden a las generadas. GET /traits no expande el catálogo.
 *         grantsResistance:
 *           type: boolean
 *           description: Si es true, los daños elegidos de este rasgo se unen a las resistencias del personaje.
 *         replaceOn:
 *           type: string
 *           description: >
 *             Clave de `restRules.kinds` del ruleset. Si se indica, el personaje puede
 *             cambiar la elección en un descanso de ese tipo (o en uno que lo incluya).
 *             Si se omite, la elección queda congelada tras el primer pick.
 *         options:
 *           type: array
 *           description: Obligatorio si no hay source. Con source puede ir vacío.
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
 *             Clave que el personaje envía y guarda en traitChoices.
 *             Con source damageTypes es el id del tipo de daño. No se pinta.
 *         label:
 *           type: string
 *           readOnly: true
 *           description: >
 *             Etiqueta visible de la fila. En filas manuales coincide con name;
 *             con source damageTypes es damage.name. Sustituye {name} en la ficha.
 *             No se envía al crear o editar el rasgo.
 *         damageTypeId:
 *           type: string
 *           description: ID de MongoDB del tipo de daño. Dos filas pueden compartir el mismo daño.
 *         area:
 *           $ref: '#/components/schemas/TraitArea'
 *           description: Área de la opción. Sustituye {area} en la ficha, en español y con coma decimal.
 *         saveAttributeId:
 *           type: string
 *           description: ID de MongoDB del atributo de la salvación. Debe pertenecer al sistema del rasgo o a un ancestro.
 *         saveAttribute:
 *           $ref: '#/components/schemas/Attribute'
 *           description: Atributo de salvación hidratado. Su nombre sustituye {save} en la ficha.
 *         damage:
 *           $ref: '#/components/schemas/Damage'
 *           description: Tipo de daño hidratado. Sustituye {damage} en la ficha.
 *     TraitArea:
 *       type: object
 *       required:
 *         - shape
 *         - length
 *         - unit
 *       properties:
 *         shape:
 *           type: string
 *           enum: [line, cone, sphere, cube]
 *           description: Forma del área. width es obligatorio solo en line.
 *         length:
 *           type: number
 *           exclusiveMinimum: 0
 *           description: Longitud del área.
 *         width:
 *           type: number
 *           exclusiveMinimum: 0
 *           description: Ancho del área. Obligatorio cuando shape es line.
 *         unit:
 *           type: string
 *           enum: [m, ft]
 *           description: Unidad de las medidas.
 *     TraitDuration:
 *       type: object
 *       required:
 *         - value
 *         - unit
 *       properties:
 *         value:
 *           type: number
 *           exclusiveMinimum: 0
 *           description: Cantidad de duración.
 *         unit:
 *           type: string
 *           enum: [minute]
 *           description: Unidad de la duración.
 *     TraitWeaponDamageBonus:
 *       type: object
 *       required:
 *         - when
 *         - melee
 *       properties:
 *         when:
 *           type: string
 *           enum: [active]
 *           description: Cuándo se aplica el bono. active solo con la stance encendida.
 *         melee:
 *           type: boolean
 *           description: Si es true, solo armas cuerpo a cuerpo.
 *         abilityKeys:
 *           type: array
 *           items:
 *             type: string
 *           description: Claves de atributo con las que debe hacerse el ataque (p. ej. str).
 *         amount:
 *           type: integer
 *           minimum: 1
 *           description: >
 *             Bono fijo o valor resuelto en la ficha según amountByClassLevel
 *             y el nivel de la clase que otorga el rasgo. Obligatorio si no hay amountByClassLevel.
 *         amountByClassLevel:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *             minimum: 1
 *           description: >
 *             Bono por nivel de la clase que otorga el rasgo (claves "1".."20").
 *             Se usa el mayor nivel menor o igual al de esa clase.
 *     TraitAction:
 *       type: object
 *       description: >
 *         Acción de catálogo para POST/PUT /traits. Zod rechaza remaining, active y saveDc
 *         (schema strict). En la ficha el GET usa TraitActionSheet.
 *       required:
 *         - activation
 *       properties:
 *         activation:
 *           type: string
 *           enum: [action, bonusAction, reaction]
 *           description: Tipo de activación.
 *         kind:
 *           type: string
 *           enum: [instant, stance]
 *           default: instant
 *           description: instant gasta un uso y acaba. stance se mantiene activa (p. ej. Furia).
 *         deactivateActivation:
 *           type: string
 *           enum: [action, bonusAction, reaction]
 *           description: Cómo se apaga una stance. Furia usa bonusAction.
 *         duration:
 *           $ref: '#/components/schemas/TraitDuration'
 *           description: Duración declarativa de la stance. No se temporiza en servidor.
 *         saveDcFormula:
 *           type: string
 *           description: >
 *             Fórmula de la CD de salvación. Admite `@proficiencyBonus` y
 *             `@attributes.{key}.modifier`. Ejemplo: `8 + @attributes.con.modifier + @proficiencyBonus`
 *         uses:
 *           oneOf:
 *             - type: integer
 *               minimum: 1
 *             - type: string
 *               enum: [unlimited]
 *           description: >
 *             Usos del catálogo o unlimited. En la ficha, si hay usesByClassLevel,
 *             TraitActionSheet.uses queda resuelto según el nivel de la clase otorgante.
 *         usesByClassLevel:
 *           type: object
 *           additionalProperties:
 *             oneOf:
 *               - type: integer
 *                 minimum: 1
 *               - type: string
 *                 enum: [unlimited]
 *           description: >
 *             Usos por nivel de la clase otorgante (claves "1".."20").
 *             En la ficha se usa el mayor nivel menor o igual al de esa clase.
 *         recharge:
 *           type: string
 *           nullable: true
 *           description: >
 *             Clave de `restRules.kinds` del ruleset. POST `/character/{id}/rest` pone spent a 0
 *             si el descanso cubre esa clave (directa o por `includes`). null si no se recargan
 *             o si uses es unlimited.
 *         recoverSpellSlots:
 *           $ref: '#/components/schemas/TraitRecoverSpellSlots'
 *           description: >
 *             Al usar el rasgo, recupera todas las ranuras gastadas de esa bolsa
 *             en la clase otorgante. Solo en acciones instantáneas. Maestro Sobrenatural
 *             usa pool fixedLevel y scope grantingClass.
 *     TraitWeaponBond:
 *       type: object
 *       required:
 *         - melee
 *         - grantsProficiency
 *         - magical
 *       properties:
 *         melee:
 *           type: boolean
 *           description: Si es true, la forma y el vínculo solo admiten armas cuerpo a cuerpo.
 *         grantsProficiency:
 *           type: boolean
 *           description: Competencia con el arma vinculada mientras está manifiesta.
 *         magical:
 *           type: boolean
 *           description: Las invocadas se marcan isMagic aunque el catálogo sea mundano.
 *     TraitUniqueEquipmentGrant:
 *       type: object
 *       required:
 *         - equipmentId
 *       properties:
 *         equipmentId:
 *           type: string
 *           description: ID de MongoDB del objeto de catálogo que se concede como instancia única.
 *     TraitUniqueEquipmentGrantApi:
 *       type: object
 *       required:
 *         - id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del objeto de catálogo concedido.
 *         name:
 *           type: string
 *           description: Nombre actual del objeto en el catálogo. No se persiste en el rasgo.
 *     TraitRecoverSpellSlots:
 *       type: object
 *       required:
 *         - pool
 *         - scope
 *       properties:
 *         pool:
 *           type: string
 *           enum: [standard, fixedLevel]
 *           description: >
 *             Bolsa a recuperar. `fixedLevel` es una bolsa de nivel fijo.
 *             `standard` es la tabla de ranuras por nivel.
 *         scope:
 *           type: string
 *           enum: [grantingClass]
 *           description: Solo las ranuras de la clase que otorga el rasgo.
 *     TraitActionSheet:
 *       allOf:
 *         - $ref: '#/components/schemas/TraitAction'
 *         - type: object
 *           description: Campos solo de lectura en GET de rasgo o ficha.
 *           properties:
 *             remaining:
 *               oneOf:
 *                 - type: integer
 *                   minimum: 0
 *                 - type: string
 *                   enum: [unlimited]
 *               description: >
 *                 uses resuelto menos traitResources[].spent, o unlimited.
 *             active:
 *               type: boolean
 *               description: True si kind es stance y el id está en activeTraitIds.
 *             saveDc:
 *               type: number
 *               description: CD calculada con saveDcFormula. Sustituye `{dc}`.
 *     TraitCatalogChoice:
 *       type: object
 *       required:
 *         - key
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
 *         source:
 *           type: string
 *           enum: [creatureTypes]
 *           description: >
 *             Origen dinámico de las opciones. Con creatureTypes se genera una opción
 *             por cada tipo de criatura del sistema del personaje y de sus ancestros.
 *             El nombre guardado es el id del tipo. Las options manuales, si se envían,
 *             se añaden a las generadas. Si se omite, options es obligatorio.
 *         creatureTypeRaces:
 *           type: array
 *           description: >
 *             Solo con source creatureTypes. Marca qué tipos exigen elegir N razas
 *             de ese tipo. El resto de tipos se elige sin razas. Los ids no se repiten.
 *           items:
 *             type: object
 *             required:
 *               - creatureTypeId
 *               - races
 *               - label
 *             properties:
 *               creatureTypeId:
 *                 type: string
 *                 description: ID de MongoDB del tipo de criatura que exige razas.
 *               races:
 *                 type: integer
 *                 minimum: 1
 *                 description: Cuántas razas de ese tipo hay que elegir.
 *                 example: 2
 *               label:
 *                 type: string
 *                 description: >
 *                   Plantilla de la ficha. Debe incluir {0}, {1}, y así hasta races - 1.
 *                 example: "{0} y {1}"
 *               creatureType:
 *                 $ref: '#/components/schemas/CreatureType'
 *                 description: Tipo de criatura hidratado.
 *         options:
 *           type: array
 *           description: >
 *             Opciones escritas a mano. Obligatorias si no hay source.
 *             Con source son opcionales y se suman a las generadas.
 *           items:
 *             $ref: '#/components/schemas/TraitCatalogOption'
 *         grants:
 *           type: array
 *           minItems: 1
 *           description: >
 *             Cuántas opciones nuevas se eligen al alcanzar cada nivel de la clase.
 *             Los niveles no se repiten. Si no hay source y ninguna opción es repeatable,
 *             la suma de choose no puede superar las opciones.
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
 *           description: >
 *             Plantilla de la ficha. Sustituye {0}, {1}, … por los textos libres
 *             o por los nombres de las razas elegidas.
 *           example: "{0} y {1}"
 *         creatureTypeId:
 *           type: string
 *           description: >
 *             ID de MongoDB del tipo de criatura. El nombre de la opción sigue siendo
 *             la clave que el personaje guarda en traitChoices.
 *         races:
 *           type: integer
 *           minimum: 1
 *           description: >
 *             Cuántas razas de ese tipo de criatura pide esta opción. Es excluyente
 *             con inputs. Si existe, label es obligatorio y usa {0}, {1}, y así sucesivamente.
 *           example: 2
 *         creatureType:
 *           $ref: '#/components/schemas/CreatureType'
 *           description: Tipo de criatura hidratado.
 *         eligibleRaces:
 *           type: array
 *           description: >
 *             Razas del sistema que pertenecen a este tipo. Solo aparece en las opciones
 *             generadas por source creatureTypes cuando ese tipo exige razas.
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID de MongoDB de la raza.
 *               name:
 *                 type: string
 *                 description: Nombre de la raza.
 *                 example: Orco
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
 *         creatureType:
 *           $ref: '#/components/schemas/CreatureType'
 *           description: Tipo de criatura de la opción elegida, si la opción lo referencia.
 *         races:
 *           type: array
 *           description: Razas elegidas para esa opción, con su id y su nombre.
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID de MongoDB de la raza.
 *               name:
 *                 type: string
 *                 description: Nombre de la raza, usado para sustituir la plantilla.
 *                 example: Orcos
 *     TraitDamageChoiceRef:
 *       type: object
 *       required:
 *         - traitId
 *         - choiceKey
 *       properties:
 *         traitId:
 *           type: string
 *           description: ID de MongoDB del rasgo que define la tabla.
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
 *           description: Clave de la fila elegida (la que está en traitChoices).
 *         label:
 *           type: string
 *           description: >
 *             Etiqueta visible. En filas manuales coincide con name;
 *             con source damageTypes es damage.name. Sustituye {name} en la ficha.
 *         damage:
 *           $ref: '#/components/schemas/Damage'
 *         area:
 *           $ref: '#/components/schemas/TraitArea'
 *           description: Área de la fila elegida.
 *         saveAttribute:
 *           $ref: '#/components/schemas/Attribute'
 *           description: Atributo de salvación de la fila elegida.
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
 *           enum: [known, classList, anyClassList]
 *           description: >
 *             Origen de los conjuros elegibles. `known` exige que estén en los conocidos
 *             de la clase (p. ej. libro de conjuros); `classList` usa la lista de la clase;
 *             `anyClassList` admite conjuros de cualquier lista (Pacto del Grimorio).
 *         atLevel:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: >
 *             Nivel de la clase que otorga el rasgo a partir del cual esta regla está
 *             activa. Si se omite, vale 1 (activa en cuanto el personaje tiene el rasgo).
 *             Varias reglas pueden compartir el mismo nivel (p. ej. Maestría sobre Conjuros).
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
 *             ritual:
 *               type: boolean
 *               description: Si está presente, el conjuro debe coincidir con ese valor de ritual.
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
 *               description: Clave de `restRules.kinds`. Nulo si es a voluntad.
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
 *     TraitInnateSpellGrant:
 *       type: object
 *       required:
 *         - spellId
 *         - atLevel
 *         - slotLevel
 *         - uses
 *         - recharge
 *       properties:
 *         spellId:
 *           type: string
 *           description: ID de MongoDB del conjuro.
 *         atLevel:
 *           type: integer
 *           minimum: 1
 *           description: Nivel de personaje a partir del cual se concede el conjuro.
 *         slotLevel:
 *           description: >
 *             Nivel de ranura al lanzar. spellLevel usa el nivel del conjuro.
 *             Los trucos solo admiten spellLevel. Un entero de 1 a 9 fija la ranura.
 *           oneOf:
 *             - type: string
 *               enum: [spellLevel]
 *             - type: integer
 *               minimum: 1
 *               maximum: 9
 *         uses:
 *           description: Usos (`unlimited` o un entero positivo).
 *           oneOf:
 *             - type: string
 *               enum: [unlimited]
 *             - type: integer
 *               minimum: 1
 *         recharge:
 *           nullable: true
 *           type: string
 *           description: Clave de `restRules.kinds`. Obligatorio si uses es un número. Nulo si es a voluntad.
 *         spell:
 *           $ref: '#/components/schemas/Spell'
 *           description: Conjuro hidratado. Solo aparece en las respuestas GET.
 *     TraitInnateSpells:
 *       type: object
 *       required:
 *         - abilityId
 *         - grants
 *       properties:
 *         abilityId:
 *           type: string
 *           description: ID de MongoDB del atributo de característica para la CD y el ataque.
 *         ability:
 *           $ref: '#/components/schemas/Attribute'
 *           description: Atributo hidratado. Solo aparece en las respuestas GET.
 *         grants:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitInnateSpellGrant'
 *           description: Conjuros concedidos. Un mismo conjuro no puede repetirse.
 *     TraitInnateSpellGrantInput:
 *       type: object
 *       required:
 *         - spellId
 *         - atLevel
 *         - slotLevel
 *         - uses
 *         - recharge
 *       properties:
 *         spellId:
 *           type: string
 *           description: ID de MongoDB del conjuro del sistema o de un ancestro.
 *         atLevel:
 *           type: integer
 *           minimum: 1
 *           description: Nivel de personaje a partir del cual se concede el conjuro.
 *         slotLevel:
 *           description: >
 *             Nivel de ranura al lanzar. spellLevel usa el nivel del conjuro.
 *             Los trucos solo admiten spellLevel.
 *           oneOf:
 *             - type: string
 *               enum: [spellLevel]
 *             - type: integer
 *               minimum: 1
 *               maximum: 9
 *         uses:
 *           description: Usos (`unlimited` o un entero positivo).
 *           oneOf:
 *             - type: string
 *               enum: [unlimited]
 *             - type: integer
 *               minimum: 1
 *         recharge:
 *           nullable: true
 *           type: string
 *           description: Clave de `restRules.kinds`. Obligatorio si uses es un número. Nulo si es a voluntad.
 *     TraitGrantedSpellInput:
 *       type: object
 *       required:
 *         - spellId
 *       properties:
 *         spellId:
 *           type: string
 *           description: ID de MongoDB del conjuro extra.
 *         ritualOnly:
 *           type: boolean
 *           default: false
 *           description: >
 *             Si es true, el conjuro solo se lanza como ritual. El conjuro debe
 *             tener ritual true. Si se omite, es false.
 *     TraitGrantedSpell:
 *       type: object
 *       required:
 *         - spellId
 *         - ritualOnly
 *       properties:
 *         spellId:
 *           type: string
 *           description: ID de MongoDB del conjuro extra.
 *         ritualOnly:
 *           type: boolean
 *           description: True si el rasgo solo permite lanzarlo como ritual.
 *         spell:
 *           $ref: '#/components/schemas/Spell'
 *           description: Conjuro hidratado. Solo aparece en las respuestas GET.
 *     TraitCreatureFormExtension:
 *       type: object
 *       required:
 *         - spellId
 *         - extraPool
 *       properties:
 *         spellId:
 *           type: string
 *           description: ID del conjuro cuyo pool se amplía.
 *         spell:
 *           $ref: '#/components/schemas/Spell'
 *           description: Conjuro hidratado. Solo en GET.
 *         extraPool:
 *           type: object
 *           description: Pool adicional (ids o filter). Se une en OR al pool del conjuro.
 *           required:
 *             - mode
 *           properties:
 *             mode:
 *               type: string
 *               enum: [ids, filter]
 *             creatureIds:
 *               type: array
 *               items:
 *                 type: string
 *             creatures:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Creature'
 *             creatureTypeIds:
 *               type: array
 *               items:
 *                 type: string
 *             creatureTypes:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CreatureType'
 *             maxCR:
 *               type: number
 *             sizes:
 *               type: array
 *               items:
 *                 type: string
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *     TraitCreatureFormExtensionInput:
 *       type: object
 *       required:
 *         - spellId
 *         - extraPool
 *       properties:
 *         spellId:
 *           type: string
 *         extraPool:
 *           type: object
 *           required:
 *             - mode
 *           properties:
 *             mode:
 *               type: string
 *               enum: [ids, filter]
 *             creatureIds:
 *               type: array
 *               items:
 *                 type: string
 *             creatureTypeIds:
 *               type: array
 *               items:
 *                 type: string
 *             maxCR:
 *               type: number
 *             sizes:
 *               type: array
 *               items:
 *                 type: string
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *     TraitInnateSpellsInput:
 *       type: object
 *       required:
 *         - abilityId
 *         - grants
 *       properties:
 *         abilityId:
 *           type: string
 *           description: ID de MongoDB del atributo de característica del sistema o de un ancestro.
 *         grants:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitInnateSpellGrantInput'
 *     TraitStackGroup:
 *       type: object
 *       required:
 *         - key
 *         - policy
 *       properties:
 *         key:
 *           type: string
 *           description: Identificador del grupo (p. ej. extra-attack, unarmored-defense).
 *         policy:
 *           type: string
 *           enum: [exclusive, max]
 *           description: exclusive no acumula; max se queda el rank mayor y sustituye el rasgo anterior.
 *         rank:
 *           type: integer
 *           minimum: 1
 *           description: Obligatorio si policy es max (p. ej. Ataque Adicional 2, 3 o 4).
 *     TraitAbilityScore:
 *       type: object
 *       required:
 *         - key
 *         - bonus
 *       properties:
 *         key:
 *           type: string
 *           description: Clave de la característica del sistema (p. ej. str, con).
 *         bonus:
 *           type: integer
 *           description: Incremento (o penalización) de la puntuación. No puede ser 0.
 *         max:
 *           type: integer
 *           minimum: 1
 *           description: Tope de esa característica mientras el rasgo esté activo (p. ej. 24).
 *     TraitSkillProficiency:
 *       type: object
 *       required:
 *         - value
 *       properties:
 *         value:
 *           type: number
 *           enum: [0.5, 1, 2]
 *           description: >
 *             Multiplicador de competencia. 0.5 es media competencia, 1 competencia
 *             completa y 2 pericia. En ficha se aplica el máximo con el valor actual.
 *         skillIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *           description: IDs de Mongo de las skills afectadas. Si falta, aplica a todas.
 *         attributeKeys:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *           description: >
 *             Claves de característica (p. ej. str, dex). Si falta, aplica a todas.
 *             Si también hay skillIds, la skill debe cumplir ambos filtros.
 *     InputCreateTrait:
 *       type: object
 *       description: >
 *         Cuerpo de POST /traits. No use Trait de lectura: IDs, no objetos hidratados.
 *         action es TraitAction. damageChoices.options es name y damageTypeId, sin id ni label.
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
 *           description: >
 *             Párrafos de resumen. Opcional; si falta o es [] no se copia description.
 *             Si coincide con description, se persiste como [].
 *         incompatible_traits:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de índices o IDs de rasgos incompatibles.
 *         stackGroup:
 *           allOf:
 *             - $ref: '#/components/schemas/TraitStackGroup'
 *           nullable: true
 *           description: Grupo de acumulación. null borra el campo.
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
 *         conditional_resistances:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de tipos de daño condicionales del sistema o de sus ancestros. Si se omite, queda vacío.
 *         conditionalConditionImmunities:
 *           type: array
 *           items:
 *             type: string
 *           description: >
 *             IDs de estados del sistema o de sus ancestros. Inmunidades que aplican
 *             en ficha si hay una stance activa del mismo grupo. Si se omite, queda vacío.
 *         conditionalResistanceGroup:
 *           type: string
 *           description: >
 *             Nombre de agrupación de resistencias e inmunidades condicionales en la ficha
 *             (p. ej. Furia).
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellPrivilegeRule'
 *           description: Reglas de privilegio de conjuro que otorga el rasgo.
 *         innateSpells:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitInnateSpellsInput'
 *           description: >
 *             Magia innata (p. ej. Linaje Infernal). Independiente de spellPrivileges.
 *             null borra el campo. grants no puede estar vacío ni repetir spellId.
 *             Si uses es unlimited, recharge debe ser null.
 *         grantedSpells:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitGrantedSpellInput'
 *           description: >
 *             Conjuros extra. IDs únicos. El conjuro con ritualOnly true debe ser
 *             un ritual. null borra el campo.
 *         creatureFormExtensions:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitCreatureFormExtensionInput'
 *           description: >
 *             Amplía el pool de formas de un conjuro con creatureForm. Un spellId
 *             por rasgo. null borra el campo.
 *         abilityScores:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitAbilityScore'
 *           description: >
 *             Bonos y topes de característica. Cada key debe existir en el sistema o un ancestro
 *             y no repetirse. null borra el campo.
 *         skillProficiencies:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitSkillProficiency'
 *           description: >
 *             Overlay de competencia al leer la ficha (0.5, 1 o 2). attributeKeys deben
 *             existir en el sistema o un ancestro. null borra el campo.
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
 *           description: >
 *             Tabla de elecciones de daño. Con source damageTypes las options pueden
 *             omitirse. null borra el campo.
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
 *         action:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitAction'
 *           description: >
 *             Acción de catálogo (TraitAction). null borra el campo. saveDcFormula admite
 *             `@proficiencyBonus` y `@attributes.{key}.modifier`. kind por defecto es instant.
 *         weaponDamageBonus:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitWeaponDamageBonus'
 *           description: Bono de daño a armas mientras la stance está activa. null borra el campo.
 *         weaponBond:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitWeaponBond'
 *           description: Arma vinculada. Exige action distinta de stance. null borra el campo.
 *         uniqueEquipmentGrant:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitUniqueEquipmentGrant'
 *           description: >
 *             Objeto único concedido (`equipmentId`). Exige action distinta de stance.
 *             null borra el campo. En GET el rasgo devuelve id y name hidratados.
 *         spellRepository:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/SpellRepositoryConfig'
 *           description: >
 *             Repositorio de conjuros del rasgo. null borra el campo.
 *     TraitLanguagesInput:
 *       type: object
 *       properties:
 *         speaks:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de Mongo de idiomas que el personaje pasa a hablar.
 *         understands:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de Mongo de idiomas que el personaje pasa a entender.
 *     TraitDamageChoiceOptionInput:
 *       type: object
 *       description: >
 *         Fila de daño en POST/PUT. La clave es name, no hay id. No envíe label, damage ni
 *         saveAttribute hidratados; Zod strict los rechaza.
 *       required:
 *         - name
 *         - damageTypeId
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre único de la fila dentro del rasgo. Es lo que guarda traitChoices.
 *         damageTypeId:
 *           type: string
 *           description: ID de MongoDB del tipo de daño del sistema o de un ancestro.
 *         area:
 *           $ref: '#/components/schemas/TraitArea'
 *           description: Área de la opción. width es obligatorio si shape es line.
 *         saveAttributeId:
 *           type: string
 *           description: ID de MongoDB del atributo de salvación del sistema o de un ancestro.
 *     TraitDamageChoiceInput:
 *       type: object
 *       required:
 *         - key
 *         - choose
 *       properties:
 *         key:
 *           type: string
 *         choose:
 *           type: integer
 *           minimum: 1
 *         source:
 *           type: string
 *           enum:
 *             - damageTypes
 *           description: >
 *             Con damageTypes las options pueden omitirse; se generan al leer el personaje.
 *         grantsResistance:
 *           type: boolean
 *         replaceOn:
 *           type: string
 *           description: Clave de `restRules.kinds` del ruleset.
 *         options:
 *           type: array
 *           description: Obligatorio si no hay source.
 *           items:
 *             $ref: '#/components/schemas/TraitDamageChoiceOptionInput'
 *     InputUpdateTrait:
 *       type: object
 *       description: >
 *         Cuerpo de PUT `/traits/{id}`. El id va en la URL. Igual que InputCreateTrait:
 *         IDs, no objetos hidratados. action es TraitAction. Opciones de daño sin id.
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
 *           description: >
 *             Párrafos de resumen. Opcional; si falta o es [] no se copia description.
 *             Si coincide con description, se persiste como [].
 *         incompatible_traits:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de índices o IDs de rasgos incompatibles.
 *         stackGroup:
 *           allOf:
 *             - $ref: '#/components/schemas/TraitStackGroup'
 *           nullable: true
 *           description: Grupo de acumulación. null borra el campo.
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
 *         conditional_resistances:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de tipos de daño condicionales. Omitirlo no modifica el valor guardado. Un array vacío borra la lista.
 *         conditionalConditionImmunities:
 *           type: array
 *           items:
 *             type: string
 *           description: >
 *             IDs de estados condicionales. Omitirlo no modifica el valor guardado.
 *             Un array vacío borra la lista.
 *         conditionalResistanceGroup:
 *           type: string
 *           nullable: true
 *           description: Nombre de agrupación de resistencias e inmunidades condicionales. null borra el campo.
 *         spellPrivileges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpellPrivilegeRule'
 *           description: Reglas de privilegio de conjuro que otorga el rasgo.
 *         innateSpells:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitInnateSpellsInput'
 *           description: >
 *             Magia innata (p. ej. Linaje Infernal). Independiente de spellPrivileges.
 *             null borra el campo.
 *         grantedSpells:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitGrantedSpellInput'
 *           description: Conjuros extra. IDs únicos. null borra el campo.
 *         creatureFormExtensions:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitCreatureFormExtensionInput'
 *           description: Amplía el pool de formas de un conjuro. null borra el campo.
 *         abilityScores:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitAbilityScore'
 *           description: Bonos y topes de característica. null borra el campo.
 *         skillProficiencies:
 *           nullable: true
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/TraitSkillProficiency'
 *           description: Overlay de competencia al leer la ficha. null borra el campo.
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
 *           description: >
 *             Tabla de elecciones de daño. Con source damageTypes las options pueden
 *             omitirse. null borra el campo.
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
 *         action:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitAction'
 *           description: >
 *             Acción de catálogo (TraitAction). null borra el campo. `{dc}` de la
 *             descripción se sustituye en la ficha por la CD calculada con saveDcFormula.
 *         weaponDamageBonus:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitWeaponDamageBonus'
 *           description: Bono de daño a armas mientras la stance está activa. null borra el campo.
 *         weaponBond:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitWeaponBond'
 *           description: Arma vinculada. Exige action distinta de stance. null borra el campo.
 *         uniqueEquipmentGrant:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/TraitUniqueEquipmentGrant'
 *           description: >
 *             Objeto único concedido (`equipmentId`). Exige action distinta de stance.
 *             null borra el campo. En GET el rasgo devuelve id y name hidratados.
 *         spellRepository:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/SpellRepositoryConfig'
 *           description: >
 *             Repositorio de conjuros del rasgo. null borra el campo.
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
 *     description: >
 *       Cree el rasgo con InputCreateTrait (IDs, no el schema Trait de lectura).
 *       action.uses, usesByClassLevel y recharge se guardan en el catálogo.
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
 *     description: >
 *       Actualice con InputUpdateTrait. El id va en la URL. No infiera el body desde Trait.
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
