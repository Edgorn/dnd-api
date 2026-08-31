import { Router } from "express";
import { equipmentController, authMiddleware } from "../../dependencies";
import { validateSchema } from "../middlewares/validateSchema";
import { CreateEquipmentSchema, UpdateEquipmentSchema } from "../schemas/equipment.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     EquipmentCost:
 *       type: object
 *       required:
 *         - quantity
 *         - unit
 *       properties:
 *         quantity:
 *           type: number
 *           description: Cantidad de monedas.
 *           example: 10
 *         unit:
 *           type: string
 *           description: ID de MongoDB de la moneda asociada (Coin).
 *           example: "60d0fe4f5311236168a109ca"
 *     LiquidVolumeDef:
 *       type: object
 *       required:
 *         - value
 *         - unit
 *       properties:
 *         value:
 *           type: number
 *           description: Cantidad o valor del volumen líquido.
 *           example: 5
 *         unit:
 *           type: string
 *           enum: [gallon, pint, ounce]
 *           description: Unidad de medida para el volumen líquido.
 *           example: "gallon"
 *     SolidVolumeDef:
 *       type: object
 *       required:
 *         - value
 *         - unit
 *       properties:
 *         value:
 *           type: number
 *           description: Cantidad o valor del volumen sólido.
 *           example: 2
 *         unit:
 *           type: string
 *           enum: [cubic_foot]
 *           description: Unidad de medida para el volumen sólido.
 *           example: "cubic_foot"
 *     ContainerRules:
 *       type: object
 *       properties:
 *         maxWeight:
 *           type: number
 *           description: Capacidad máxima de peso que soporta el contenedor.
 *           example: 30
 *         maxItems:
 *           type: number
 *           description: Cantidad máxima de objetos que puede contener.
 *           example: 20
 *         acceptedStorageTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Etiquetas aceptadas por el contenedor. Si está vacío o ausente, acepta todo.
 *           example: ["ammunition"]
 *         maxLiquidCapacity:
 *           $ref: '#/components/schemas/LiquidVolumeDef'
 *         maxSolidCapacity:
 *           $ref: '#/components/schemas/SolidVolumeDef'
 *     EquipSlot:
 *       type: string
 *       enum: [head, neck, cloak, armor, hands, waist, feet, ring, main_hand, off_hand, two_handed]
 *       description: Ranura de equipamiento del personaje donde se coloca el objeto.
 *       example: "head"
 *     WeaponDamage:
 *       type: object
 *       required:
 *         - dice
 *         - type
 *       properties:
 *         dice:
 *           type: string
 *           description: Dado de daño (ej. 1d6, 1d8).
 *           example: "1d6"
 *         type:
 *           type: string
 *           description: ID de MongoDB del tipo de daño (Damage).
 *           example: "60d0fe4f5311236168a109ca"
 *     WeaponDamageApi:
 *       type: object
 *       properties:
 *         dice:
 *           type: string
 *           description: Dado de daño.
 *           example: "1d6"
 *         name:
 *           type: string
 *           description: Nombre del tipo de daño.
 *           example: "Cortante"
 *         desc:
 *           type: string
 *           description: Descripción del daño.
 *           example: "Daño infligido por armas afiladas"
 *     WeaponRangeThrow:
 *       type: object
 *       properties:
 *         normal:
 *           type: number
 *           description: Alcance normal de lanzamiento en pies.
 *           example: 20
 *         long:
 *           type: number
 *           description: Alcance largo de lanzamiento en pies.
 *           example: 60
 *     Weapon:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           description: Categoría del arma (ej. Simple Melee, Martial Melee).
 *           example: "Simple Melee"
 *         damage:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WeaponDamageApi'
 *         two_handed_damage:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WeaponDamageApi'
 *         properties:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Property'
 *         range:
 *           type: string
 *           description: Alcance del arma.
 *           example: "Melee"
 *         range_throw:
 *           $ref: '#/components/schemas/WeaponRangeThrow'
 *     WeaponInput:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           description: Categoría del arma.
 *           example: "Simple Melee"
 *         damage:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WeaponDamage'
 *         two_handed_damage:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WeaponDamage'
 *         properties:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de MongoDB de las propiedades del arma.
 *           example: ["60d0fe4f5311236168a109cb"]
 *         range:
 *           type: string
 *           description: Alcance del arma.
 *           example: "Melee"
 *         range_throw:
 *           $ref: '#/components/schemas/WeaponRangeThrow'
 *     Equipment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del equipamiento.
 *         ruleset:
 *           type: string
 *           description: ID del sistema asociado.
 *         name:
 *           type: string
 *           description: Nombre del objeto o equipamiento.
 *         description:
 *           type: string
 *           description: Descripción detallada del objeto.
 *         cost:
 *           $ref: '#/components/schemas/EquipmentCost'
 *         weight:
 *           type: number
 *           description: Peso del objeto en libras o kilogramos.
 *         category:
 *           type: string
 *           description: Categoría principal del equipamiento (ej. Armas, Armaduras, Herramientas).
 *         subcategory:
 *           type: string
 *           description: Subcategoría del equipamiento (ej. Armas cuerpo a cuerpo simples).
 *         equipSlot:
 *           $ref: '#/components/schemas/EquipSlot'
 *           nullable: true
 *         storageTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Etiquetas de almacenaje que definen qué es este objeto a la hora de guardarse.
 *           example: ["ammunition", "arrow"]
 *         containerStats:
 *           $ref: '#/components/schemas/ContainerRules'
 *         proficiencies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Proficiency'
 *           description: Competencias requeridas para usar el equipamiento.
 *         weapon:
 *           $ref: '#/components/schemas/Weapon'
 *     InputCreateEquipment:
 *       type: object
 *       required:
 *         - ruleset
 *         - name
 *         - description
 *         - cost
 *         - weight
 *         - category
 *         - subcategory
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID del sistema en el que se crea el equipamiento.
 *         name:
 *           type: string
 *           description: Nombre del equipamiento.
 *         description:
 *           type: string
 *           description: Descripción del equipamiento.
 *         cost:
 *           $ref: '#/components/schemas/EquipmentCost'
 *         weight:
 *           type: number
 *           description: Peso del equipamiento.
 *         category:
 *           type: string
 *           description: Categoría del equipamiento.
 *         subcategory:
 *           type: string
 *           description: Subcategoría del equipamiento.
 *         equipSlot:
 *           $ref: '#/components/schemas/EquipSlot'
 *           nullable: true
 *         storageTags:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *           description: Etiquetas de almacenaje del equipamiento.
 *           example: ["ammunition", "arrow"]
 *         containerStats:
 *           $ref: '#/components/schemas/ContainerRules'
 *         proficiencies:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de MongoDB de las competencias requeridas para usar el equipamiento.
 *           example: ["60d0fe4f5311236168a109cc"]
 *         weapon:
 *           $ref: '#/components/schemas/WeaponInput'
 *     InputUpdateEquipment:
 *       type: object
 *       properties:
 *         ruleset:
 *           type: string
 *           description: ID del sistema asociado.
 *         name:
 *           type: string
 *           description: Nombre del equipamiento.
 *         description:
 *           type: string
 *           description: Descripción del equipamiento.
 *         cost:
 *           $ref: '#/components/schemas/EquipmentCost'
 *         weight:
 *           type: number
 *           description: Peso del equipamiento.
 *         category:
 *           type: string
 *           description: Categoría del equipamiento.
 *         subcategory:
 *           type: string
 *           description: Subcategoría del equipamiento.
 *         equipSlot:
 *           $ref: '#/components/schemas/EquipSlot'
 *           nullable: true
 *         storageTags:
 *           type: array
 *           items:
 *             type: string
 *           nullable: true
 *           description: Etiquetas de almacenaje del equipamiento (puede ser null para vaciar).
 *           example: ["ammunition", "arrow"]
 *         containerStats:
 *           $ref: '#/components/schemas/ContainerRules'
 *         proficiencies:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de MongoDB de las competencias requeridas para usar el equipamiento.
 *           example: ["60d0fe4f5311236168a109cc"]
 *         weapon:
 *           $ref: '#/components/schemas/WeaponInput'
 *           nullable: true
 */

/**
 * @openapi
 * /equipment:
 *   get:
 *     summary: Obtener lista de equipamientos filtrados por sistemas
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleset
 *         schema:
 *           type: string
 *         description: ID o nombre del sistema para filtrar equipamientos (incluye ancestros).
 *     responses:
 *       200:
 *         description: Lista de equipamientos devuelta con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Equipment'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/equipment", authMiddleware, equipmentController.getBySystems);

/**
 * @openapi
 * /equipment/{id}:
 *   get:
 *     summary: Obtener un equipamiento por su ID
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del equipamiento.
 *     responses:
 *       200:
 *         description: Equipamiento encontrado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Equipamiento no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/equipment/:id", authMiddleware, equipmentController.getById);

/**
 * @openapi
 * /equipment:
 *   post:
 *     summary: Crear un nuevo equipamiento
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputCreateEquipment'
 *     responses:
 *       201:
 *         description: Equipamiento creado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 *       400:
 *         description: Datos de entrada inválidos o faltantes.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Permisos insuficientes para crear en este sistema.
 *       404:
 *         description: Sistema asociado no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/equipment", authMiddleware, validateSchema(CreateEquipmentSchema), equipmentController.create);

/**
 * @openapi
 * /equipment/{id}:
 *   put:
 *     summary: Actualizar un equipamiento existente
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del equipamiento a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputUpdateEquipment'
 *     responses:
 *       200:
 *         description: Equipamiento modificado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipment'
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Permisos insuficientes para modificar este equipamiento.
 *       404:
 *         description: Equipamiento o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put("/equipment/:id", authMiddleware, validateSchema(UpdateEquipmentSchema), equipmentController.update);

/**
 * @openapi
 * /equipment/{id}:
 *   delete:
 *     summary: Realizar un borrado lógico de un equipamiento
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del equipamiento a eliminar.
 *     responses:
 *       204:
 *         description: Equipamiento eliminado con éxito.
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Permisos insuficientes para eliminar este equipamiento.
 *       404:
 *         description: Equipamiento o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete("/equipment/:id", authMiddleware, equipmentController.delete);

/**
 * @openapi
 * /equipment/{id}/restore:
 *   patch:
 *     summary: Restaurar un equipamiento previamente borrado
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del equipamiento a restaurar.
 *     responses:
 *       200:
 *         description: Equipamiento restaurado con éxito.
 *       400:
 *         description: ID inválido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: Permisos insuficientes para restaurar este equipamiento.
 *       404:
 *         description: Equipamiento o sistema no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.patch("/equipment/:id/restore", authMiddleware, equipmentController.restore);

/**
 * @openapi
 * /equipment/type/{type}:
 *   get:
 *     summary: Obtener equipamientos por tipo de categoría
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la categoría o tipo.
 *     responses:
 *       200:
 *         description: Lista de equipamientos básicos obtenida con éxito.
 */
router.get("/equipment/type/:type", authMiddleware, equipmentController.getByTypes);

/**
 * @openapi
 * /equipment/types:
 *   post:
 *     summary: Obtener equipamientos filtrando por múltiples tipos
 *     tags:
 *       - Equipamiento
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Lista de equipamientos básicos devuelta con éxito.
 */
router.post("/equipment/types", authMiddleware, equipmentController.getByTypes);

export default router;
