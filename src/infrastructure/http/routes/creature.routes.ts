import { Router } from "express";
import { creatureController, authMiddleware } from "../../dependencies";
import { validateQuery, validateSchema } from "../middlewares/validateSchema";
import { CreateCreatureSchema, GetCreaturesQuerySchema, UpdateCreatureSchema } from "../schemas/creature.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Creature:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la criatura.
 *         name:
 *           type: string
 *         ruleset:
 *           type: string
 *           description: ID del sistema al que pertenece.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         creatureType:
 *           $ref: '#/components/schemas/CreatureType'
 *         race:
 *           nullable: true
 *           description: Sin raza (null), la cadena "any" si admite cualquier raza, o la referencia resuelta de una raza del catálogo. El nombre es el canónico de la raza.
 *           oneOf:
 *             - type: 'null'
 *             - type: string
 *               enum:
 *                 - any
 *             - $ref: '#/components/schemas/CreatureRaceRef'
 *         size:
 *           type: string
 *         alignment:
 *           type: string
 *         armor_class:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *             notes:
 *               type: string
 *         CA:
 *           type: number
 *           description: Clase de armadura resuelta.
 *         HPMax:
 *           type: number
 *         hit_dice:
 *           type: string
 *         speed:
 *           type: object
 *           description: Velocidades de movimiento en pies.
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
 *         attributes:
 *           type: array
 *           items:
 *             type: object
 *         skills:
 *           type: array
 *           description: Solo las habilidades presentes en skill_bonuses, en ese orden. El modificador es el bono guardado.
 *           items:
 *             type: object
 *         senses:
 *           type: object
 *           description: Distancias de sentidos en pies. passive_perception es el valor resuelto.
 *         languages:
 *           type: object
 *         language_choices:
 *           $ref: '#/components/schemas/LanguageChoiceApi'
 *         challenge_rating:
 *           type: number
 *         xp:
 *           type: number
 *         prof_bonus:
 *           type: number
 *         spellcasting:
 *           type: object
 *           description: Nivel de lanzador, aptitud mágica, CD de salvación, bonificador de ataque, ranuras y conjuros del catálogo. Si la criatura no lanza conjuros, las ranuras y la lista van vacías.
 *           properties:
 *             casterLevel:
 *               type: integer
 *               minimum: 1
 *               description: Nivel de lanzador de conjuros.
 *             ability:
 *               $ref: '#/components/schemas/Attribute'
 *               description: Aptitud mágica (atributo) usada para lanzar conjuros.
 *             spellSaveDc:
 *               type: integer
 *               description: CD de salvación de conjuros.
 *             spellAttackBonus:
 *               type: integer
 *               description: Bonificador de ataque de conjuros.
 *             slots:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               description: Ranuras por nivel. La clave es el nivel del conjuro y el valor es el número de ranuras.
 *             spells:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Spell'
 *         special_abilities:
 *           type: array
 *           items:
 *             type: object
 *         actions:
 *           type: array
 *           items:
 *             type: object
 *           description: Acciones. El alcance (reach) y el rango se expresan en pies.
 *         bonus_actions:
 *           type: array
 *           items:
 *             type: object
 *         reactions:
 *           type: array
 *           items:
 *             type: object
 *         equipment:
 *           type: array
 *           items:
 *             type: object
 *           description: Equipo de la criatura. El peso del catálogo se guarda en libras.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     CreatureRaceRef:
 *       type: object
 *       description: Referencia de una raza del catálogo.
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           description: Nombre canónico de la raza.
 *         ruleset:
 *           type: string
 *         creatureTypeId:
 *           type: string
 *           nullable: true
 *     InputCreateCreature:
 *       type: object
 *       required:
 *         - name
 *         - ruleset
 *         - creatureTypeId
 *         - size
 *         - alignment
 *         - HPMax
 *         - speed
 *         - challenge_rating
 *         - xp
 *         - prof_bonus
 *       properties:
 *         name:
 *           type: string
 *         ruleset:
 *           type: string
 *         img:
 *           type: string
 *           nullable: true
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         creatureTypeId:
 *           type: string
 *           description: ID del tipo de criatura del sistema o de un ancestro.
 *         race:
 *           type: string
 *           nullable: true
 *           description: Omitido o null si la criatura no tiene raza. "any" si admite cualquier raza. Cualquier otro valor es el ID de una raza existente, no borrada, del sistema de la criatura o de un ancestro.
 *           example: any
 *         size:
 *           type: string
 *         alignment:
 *           type: string
 *         armor_class:
 *           type: object
 *           nullable: true
 *           properties:
 *             value:
 *               type: number
 *             notes:
 *               type: string
 *         HPMax:
 *           type: number
 *         hit_dice:
 *           type: string
 *           nullable: true
 *         speed:
 *           type: object
 *           description: Velocidades en pies. Un humanoide mediano camina 30 pies.
 *           required:
 *             - walk
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
 *         attributes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: number
 *         saving_throws:
 *           type: array
 *           items:
 *             type: string
 *         skill_bonuses:
 *           type: array
 *           nullable: true
 *           items:
 *             type: object
 *             properties:
 *               skillId:
 *                 type: string
 *               bonus:
 *                 type: number
 *           description: Habilidades que devuelve la criatura y su bono total, en este orden.
 *         senses:
 *           type: object
 *           nullable: true
 *           description: Distancias en pies.
 *         languages:
 *           type: object
 *           nullable: true
 *         language_choices:
 *           nullable: true
 *           description: Elección de idiomas al crear la criatura. Misma forma que ChoiceMongo. Solo `choose` ofrece todos los idiomas del sistema. `options` limita la elección a esos identificadores de idioma. `filter` busca idiomas por criterio. Envíe null para no guardar elección.
 *           allOf:
 *             - $ref: '#/components/schemas/ChoiceMongo'
 *         challenge_rating:
 *           type: number
 *         xp:
 *           type: number
 *         prof_bonus:
 *           type: number
 *         damage_vulnerabilities:
 *           type: array
 *           items:
 *             type: string
 *         damage_immunities:
 *           type: array
 *           items:
 *             type: string
 *         damage_resistances:
 *           type: array
 *           items:
 *             type: string
 *         condition_immunities:
 *           type: array
 *           items:
 *             type: string
 *         special_abilities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreatureFeature'
 *         spellcasting:
 *           type: object
 *           nullable: true
 *           description: Nivel de lanzador, aptitud mágica, CD de salvación, bonificador de ataque, ranuras y lista de identificadores de conjuros del catálogo. Null si la criatura no lanza conjuros.
 *           properties:
 *             casterLevel:
 *               type: integer
 *               minimum: 1
 *               description: Nivel de lanzador de conjuros.
 *             abilityId:
 *               type: string
 *               description: Identificador del atributo usado como aptitud mágica.
 *             spellSaveDc:
 *               type: integer
 *               description: CD de salvación de conjuros. Se guarda tal cual, sin calcularse.
 *             spellAttackBonus:
 *               type: integer
 *               description: Bonificador de ataque de conjuros. Se guarda tal cual, sin calcularse.
 *             slots:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *                 minimum: 0
 *               description: Ranuras por nivel de conjuro. La clave es el nivel (por ejemplo "1") y el valor es el número de ranuras.
 *             spells:
 *               type: array
 *               items:
 *                 type: string
 *               description: Identificadores de conjuros del catálogo, en el orden deseado.
 *         actions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreatureFeature'
 *         bonus_actions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreatureFeature'
 *         reactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreatureFeature'
 *         legendary_actions:
 *           type: object
 *           nullable: true
 *         equipment:
 *           type: array
 *           nullable: true
 *           items:
 *             $ref: '#/components/schemas/GrantedEquipmentEntry'
 *     CreatureFeature:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *         attack:
 *           type: object
 *           description: Alcance y rango en pies.
 *           properties:
 *             kind:
 *               type: string
 *               enum: [melee_weapon, ranged_weapon, melee_spell, ranged_spell]
 *             attributeKey:
 *               type: string
 *             bonus:
 *               type: number
 *               description: Si se omite, se calcula como modificador del atributo más el bono de competencia.
 *             reach:
 *               type: number
 *               description: Alcance en pies.
 *             range:
 *               type: object
 *               description: Distancia en pies.
 *               properties:
 *                 normal:
 *                   type: number
 *                 long:
 *                   type: number
 *             targets:
 *               type: string
 *             damage:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dice:
 *                     type: string
 *                   bonus:
 *                     type: number
 *                   damageTypeId:
 *                     type: string
 *     InputUpdateCreature:
 *       type: object
 *       description: Cualquier subconjunto de InputCreateCreature. El id va en la ruta.
 */

/**
 * @openapi
 * /creatures:
 *   get:
 *     summary: Obtener las criaturas de uno o varios sistemas
 *     description: Incluye criaturas de los sistemas ancestros. El publicador también ve las borradas lógicamente. Se puede filtrar por tipo de criatura.
 *     tags:
 *       - Criaturas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: ID o nombre del sistema. Incluye ancestros.
 *       - in: query
 *         name: creatureTypeId
 *         schema:
 *           type: string
 *         description: Filtra por el ID del tipo de criatura.
 *     responses:
 *       200:
 *         description: Listado de criaturas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Creature'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/creatures", authMiddleware, validateQuery(GetCreaturesQuerySchema), creatureController.getBySystems);

/**
 * @openapi
 * /creatures/{id}:
 *   get:
 *     summary: Obtener una criatura por ID
 *     tags:
 *       - Criaturas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Criatura obtenida.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Creature'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Criatura no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get("/creatures/:id", authMiddleware, creatureController.getById);

/**
 * @openapi
 * /creatures:
 *   post:
 *     summary: Crear una criatura
 *     description: Las distancias (velocidad, sentidos, alcance y rango) se guardan en pies. El peso del equipo permanece en libras.
 *     tags:
 *       - Criaturas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateCreature'
 *     responses:
 *       201:
 *         description: Criatura creada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Creature'
 *       400:
 *         description: Datos inválidos o referencias fuera del sistema.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para crear criaturas en este sistema.
 *       404:
 *         description: Sistema o referencia de catálogo no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.post("/creatures", authMiddleware, validateSchema(CreateCreatureSchema), creatureController.create);

/**
 * @openapi
 * /creatures/{id}:
 *   put:
 *     summary: Modificar una criatura
 *     tags:
 *       - Criaturas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateCreature'
 *     responses:
 *       200:
 *         description: Criatura modificada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Creature'
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para editar esta criatura.
 *       404:
 *         description: Criatura no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.put("/creatures/:id", authMiddleware, validateSchema(UpdateCreatureSchema), creatureController.update);

/**
 * @openapi
 * /creatures/{id}:
 *   delete:
 *     summary: Borrado lógico de una criatura
 *     tags:
 *       - Criaturas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Criatura borrada lógicamente.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para borrar esta criatura.
 *       404:
 *         description: Criatura no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete("/creatures/:id", authMiddleware, creatureController.delete);

/**
 * @openapi
 * /creatures/{id}/restore:
 *   patch:
 *     summary: Restaurar una criatura borrada lógicamente
 *     tags:
 *       - Criaturas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Criatura restaurada.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: No tienes permisos para restaurar esta criatura.
 *       404:
 *         description: Criatura no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.patch("/creatures/:id/restore", authMiddleware, creatureController.restore);

export default router;
