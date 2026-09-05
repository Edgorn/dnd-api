import { Router } from "express";
import { backgroundController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateBackgroundSchema, UpdateBackgroundSchema } from "../schemas/background.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Background:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único autogenerado por MongoDB.
 *         ruleset:
 *           type: string
 *           description: Sistema de juego al que pertenece el trasfondo.
 *         name:
 *           type: string
 *           description: Nombre del trasfondo.
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: Descripción del trasfondo en párrafos.
 *         img:
 *           type: string
 *           description: URL de la imagen del trasfondo.
 *         god:
 *           type: boolean
 *           description: Indica si el trasfondo otorga deidad asociada.
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *           description: Array de IDs de rasgos asociados.
 *         traits_data:
 *           type: object
 *           description: Datos adicionales y mapa de configuración para los rasgos.
 *         language_choices:
 *           type: object
 *           description: Elección de idiomas para el trasfondo.
 *         equipment_choices:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EquipmentChoiceApi'
 *           description: Opciones de equipamiento inicial resueltas para el trasfondo.
 *         equipment:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundCharacterEquipment'
 *           description: Equipamiento fijo otorgado por el trasfondo, con datos base resueltos y personalizaciones aplicadas.
 *         personality_traits:
 *           type: array
 *           items:
 *             type: string
 *           description: Opciones de rasgos de personalidad.
 *         ideals:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               alignment:
 *                 type: string
 *           description: Lista de ideales con título, descripción y alineamiento.
 *         bonds:
 *           type: array
 *           items:
 *             type: string
 *           description: Opciones de vínculos.
 *         flaws:
 *           type: array
 *           items:
 *             type: string
 *           description: Opciones de defectos.
 *         money:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Cantidad de monedas.
 *               id:
 *                 type: string
 *               ruleset:
 *                 type: string
 *               name:
 *                 type: string
 *               abbreviation:
 *                 type: string
 *               isBase:
 *                 type: boolean
 *               multiplier:
 *                 type: number
 *               weight:
 *                 type: number
 *               deletedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *           description: Monedas iniciales otorgadas por el trasfondo.
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha de borrado lógico, o null si está activo.
 *     EquipmentChoiceApi:
 *       type: object
 *       properties:
 *         choose:
 *           type: number
 *           description: Cantidad de objetos de equipamiento a seleccionar.
 *         options:
 *           type: array
 *           description: Si query_type es options/filter/all, lista de Equipment. Si es mixed, lista de ramas (item o choice anidada).
 *           items:
 *             oneOf:
 *               - $ref: '#/components/schemas/Equipment'
 *               - $ref: '#/components/schemas/EquipmentChoiceBranchApi'
 *         query_type:
 *           type: string
 *           enum: [all, options, filter, mixed]
 *           description: Tipo de consulta. mixed indica alternativas heterogéneas (ítem concreto vs sub-elección).
 *         query_filter:
 *           $ref: '#/components/schemas/EquipmentChoiceFilter'
 *           description: Filtro aplicado si el query_type fue 'filter'. El ruleset se aplica automáticamente en servidor.
 *     EquipmentChoiceBranchApi:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [item, choice]
 *           description: item = equipamiento concreto; choice = sub-elección (options o filter).
 *         value:
 *           description: Equipment si type=item; ChoiceApi de Equipment si type=choice.
 *           oneOf:
 *             - $ref: '#/components/schemas/Equipment'
 *             - $ref: '#/components/schemas/EquipmentChoiceApi'
 *         quantity:
 *           type: number
 *           description: Cantidad cuando type=item (por defecto 1).
 *     EquipmentChoiceFilter:
 *       type: object
 *       description: Criterios de filtrado dinámico de equipamiento. El ruleset del trasfondo se resuelve en servidor (con ancestros del sistema); no debe enviarse en el body.
 *       properties:
 *         category:
 *           type: string
 *           description: Categoría del equipamiento (ej. "Arma", "Armadura").
 *         subcategory:
 *           type: string
 *           description: Subcategoría del equipamiento (ej. "Espada larga", "Armadura ligera").
 *         weapon.category:
 *           type: string
 *           description: Categoría del arma dentro del equipamiento (ej. "Simple", "Martial").
 *         weaponCategory:
 *           type: string
 *           description: Alias de weapon.category.
 *         weapon.range:
 *           type: string
 *           description: Alcance del arma (ej. "Melee", "Ranged").
 *         weaponRange:
 *           type: string
 *           description: Alias de weapon.range.
 *     BackgroundEquipmentChoiceInput:
 *       type: object
 *       required:
 *         - choose
 *       properties:
 *         choose:
 *           type: number
 *           description: Cantidad de opciones que el jugador debe elegir.
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista explícita de IDs de MongoDB. Mutuamente excluyente con filter y alternatives.
 *         filter:
 *           $ref: '#/components/schemas/EquipmentChoiceFilter'
 *           description: Criterios de filtrado dinámico. Mutuamente excluyente con options y alternatives.
 *         alternatives:
 *           type: array
 *           description: Ramas heterogéneas (ítem vs sub-elección). Mutuamente excluyente con options/filter. Ejemplo Mago, saquito o canalizador arcano.
 *           items:
 *             $ref: '#/components/schemas/EquipmentChoiceBranchInput'
 *     EquipmentChoiceBranchInput:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [item, choice]
 *         id:
 *           type: string
 *           description: ID del equipamiento cuando type=item.
 *         quantity:
 *           type: number
 *           description: Cantidad cuando type=item.
 *         choose:
 *           type: number
 *           description: Cantidad a elegir cuando type=choice.
 *         options:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs cuando type=choice (modo options).
 *         filter:
 *           $ref: '#/components/schemas/EquipmentChoiceFilter'
 *           description: Filtro cuando type=choice (modo filter).
 *     BackgroundCharacterEquipment:
 *       allOf:
 *         - $ref: '#/components/schemas/Equipment'
 *         - type: object
 *           required:
 *             - quantity
 *           properties:
 *             quantity:
 *               type: number
 *               description: Cantidad de unidades de este equipamiento.
 *             equipped:
 *               type: boolean
 *               description: Indica si el objeto está equipado.
 *             isMagic:
 *               type: boolean
 *               description: Indica si el objeto es mágico.
 *             isBond:
 *               type: boolean
 *               description: Indica si el objeto tiene un vínculo especial.
 *     BackgroundEquipmentInput:
 *       type: object
 *       description: Equipamiento fijo del trasfondo. Debe incluir id (referencia a equipamiento base) o name (objeto personalizado). Todos los demás campos son opcionales y sobrescriben los valores base.
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del equipamiento base a referenciar.
 *         name:
 *           type: string
 *           description: Nombre personalizado del objeto. Obligatorio si no se indica id.
 *         quantity:
 *           type: number
 *           description: Cantidad de unidades. Por defecto 1.
 *         description:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *           description: Descripción personalizada del objeto.
 *         cost:
 *           $ref: '#/components/schemas/EquipmentCost'
 *         weight:
 *           type: number
 *           description: Peso personalizado en libras o kilogramos.
 *         category:
 *           type: string
 *           description: Categoría personalizada del equipamiento.
 *         subcategory:
 *           type: string
 *           description: Subcategoría personalizada del equipamiento.
 *         equipSlot:
 *           $ref: '#/components/schemas/EquipSlot'
 *           nullable: true
 *         storageTags:
 *           type: array
 *           items:
 *             type: string
 *         containerStats:
 *           $ref: '#/components/schemas/ContainerRules'
 *         weapon:
 *           type: object
 *           description: Datos de arma personalizados. Sobrescribe parcialmente el arma base si se indica id.
 *           properties:
 *             category:
 *               type: string
 *             damage:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - dice
 *                   - type
 *                 properties:
 *                   dice:
 *                     type: string
 *                     description: Expresión de dado (ej. "1d8", "1d8+1").
 *                   type:
 *                     type: string
 *                     description: ID de MongoDB del tipo de daño.
 *             two_handed_damage:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   dice:
 *                     type: string
 *                   type:
 *                     type: string
 *             properties:
 *               type: array
 *               items:
 *                 type: string
 *             range:
 *               type: string
 *             proficiencies:
 *               type: array
 *               items:
 *                 type: string
 *         armor:
 *           type: object
 *           description: Datos de armadura personalizados. Sobrescribe parcialmente la armadura base si se indica id.
 *           properties:
 *             category:
 *               type: string
 *             class:
 *               type: object
 *               properties:
 *                 base:
 *                   type: number
 *                 dex_bonus:
 *                   type: number
 *                 max_bonus:
 *                   type: number
 *             str_minimum:
 *               type: number
 *             stealth_disadvantage:
 *               type: number
 *         isMagic:
 *           type: boolean
 *         isBond:
 *           type: boolean
 *         equipped:
 *           type: boolean
 *         bonuses:
 *           type: object
 *           properties:
 *             armor_class:
 *               type: number
 *             saving_throws:
 *               type: number
 *         content:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BackgroundEquipmentInput'
 *           description: Contenido interno para objetos contenedor.
 */

/**
 * @openapi
 * /backgrounds:
 *   get:
 *     summary: Obtener trasfondos por sistemas
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: Filtrar por código del sistema de juego.
 *     responses:
 *       200:
 *         description: Lista de trasfondos obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Background'
 *       401:
 *         description: No autorizado.
 */
router.get('/backgrounds', authMiddleware, backgroundController.getBackgrounds);

/**
 * @openapi
 * /backgrounds/{id}:
 *   get:
 *     summary: Obtener un trasfondo por ID
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo.
 *     responses:
 *       200:
 *         description: Trasfondo encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Background'
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.get('/backgrounds/:id', authMiddleware, backgroundController.getById);

/**
 * @openapi
 * /backgrounds:
 *   post:
 *     summary: Crear un nuevo trasfondo
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruleset
 *               - name
 *             properties:
 *               ruleset:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               img:
 *                 type: string
 *               god:
 *                 type: boolean
 *               traits:
 *                 type: array
 *                 items:
 *                   type: string
 *               traits_data:
 *                 type: object
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               language_choices:
 *                 type: object
 *               equipment_choices:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *                 description: Elecciones de equipamiento inicial. Cada ítem usa options (IDs explícitos) o filter (category, subcategory, weapon.category/weaponCategory, weapon.range/weaponRange). El ruleset se aplica en servidor.
 *               equipment:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BackgroundEquipmentInput'
 *                 description: Equipamiento fijo otorgado. Cada ítem requiere id o name; el resto de campos personalizan el objeto base.
 *               personality_traits:
 *                 type: array
 *                 items:
 *                   type: string
 *               ideals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                     - alignment
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     alignment:
 *                       type: string
 *               bonds:
 *                 type: array
 *                 items:
 *                   type: string
 *               flaws:
 *                 type: array
 *                 items:
 *                   type: string
 *               money:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - quantity
 *                     - unit
 *                   properties:
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                       description: ID de la moneda.
 *     responses:
 *       201:
 *         description: Trasfondo creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Background'
 *       400:
 *         description: Datos de entrada inválidos.
 */
router.post('/backgrounds', authMiddleware, validateSchema(CreateBackgroundSchema), backgroundController.create);

/**
 * @openapi
 * /backgrounds/{id}:
 *   put:
 *     summary: Actualizar un trasfondo existente
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ruleset:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               img:
 *                 type: string
 *               god:
 *                 type: boolean
 *               traits:
 *                 type: array
 *                 items:
 *                   type: string
 *               traits_data:
 *                 type: object
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               language_choices:
 *                 type: object
 *               equipment_choices:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BackgroundEquipmentChoiceInput'
 *                 description: Elecciones de equipamiento inicial. Cada ítem usa options (IDs explícitos) o filter (category, subcategory, weapon.category/weaponCategory, weapon.range/weaponRange). El ruleset se aplica en servidor.
 *               equipment:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/BackgroundEquipmentInput'
 *                 description: Equipamiento fijo otorgado. Cada ítem requiere id o name; el resto de campos personalizan el objeto base.
 *               personality_traits:
 *                 type: array
 *                 items:
 *                   type: string
 *               ideals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     alignment:
 *                       type: string
 *               bonds:
 *                 type: array
 *                 items:
 *                   type: string
 *               flaws:
 *                 type: array
 *                 items:
 *                   type: string
 *               money:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - quantity
 *                     - unit
 *                   properties:
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                       description: ID de la moneda.
 *     responses:
 *       200:
 *         description: Trasfondo actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Background'
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.put('/backgrounds/:id', authMiddleware, validateSchema(UpdateBackgroundSchema), backgroundController.update);

/**
 * @openapi
 * /backgrounds/{id}:
 *   delete:
 *     summary: Eliminar un trasfondo (borrado lógico)
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo a eliminar.
 *     responses:
 *       204:
 *         description: Trasfondo eliminado con éxito.
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.delete('/backgrounds/:id', authMiddleware, backgroundController.delete);

/**
 * @openapi
 * /backgrounds/{id}/restore:
 *   patch:
 *     summary: Restaurar un trasfondo eliminado previamente
 *     tags:
 *       - Trasfondos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del trasfondo a restaurar.
 *     responses:
 *       200:
 *         description: Trasfondo restaurado exitosamente.
 *       404:
 *         description: Trasfondo no encontrado.
 */
router.patch('/backgrounds/:id/restore', authMiddleware, backgroundController.restore);

export default router;
