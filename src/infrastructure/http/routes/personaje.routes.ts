import { Router } from "express";
import { personajeController, authMiddleware } from "../../dependencies";

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
 *                 type: string
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
 *             type: object
 *         languages:
 *           type: object
 *         proficiencies:
 *           type: array
 *           items:
 *             type: object
 *         traits:
 *           type: array
 *           items:
 *             type: object
 *         traits_data:
 *           type: object
 *         resistances:
 *           type: array
 *           items:
 *             type: object
 *         conditional_resistances:
 *           type: array
 *           items:
 *             type: object
 *         condition_inmunities:
 *           type: array
 *           items:
 *             type: object
 *         prof_bonus:
 *           type: number
 *         saving_throws:
 *           type: array
 *           items:
 *             type: string
 *         equipment:
 *           type: array
 *           items:
 *             type: object
 *         dotes:
 *           type: array
 *           items:
 *             type: object
 *         money:
 *           type: object
 *           properties:
 *             pc:
 *               type: number
 *             pp:
 *               type: number
 *             pe:
 *               type: number
 *             po:
 *               type: number
 *             ppt:
 *               type: number
 *         spells:
 *           type: object
 *         cargaMaxima:
 *           type: number
 *         spellcasting:
 *           type: array
 *           items:
 *             type: object
 *         invocations:
 *           type: array
 *           items:
 *             type: object
 *         forms:
 *           type: array
 *           items:
 *             type: object
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
 *         subraceId:
 *           type: string
 *         type:
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
 *               index:
 *                 type: string
 *               quantity:
 *                 type: number
 *         traits:
 *           type: array
 *           items:
 *             type: string
 *         traits_data:
 *           type: object
 *         money:
 *           type: object
 *           properties:
 *             unit:
 *               type: string
 *             quantity:
 *               type: number
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
router.post('/character/updateMoney', authMiddleware, personajeController.modificarDinero);
router.post('/character/vincularPacto', authMiddleware, personajeController.vincularArmaPacto);
router.post('/character/changeXp', authMiddleware, personajeController.changeXp);
router.post('/character/levelUpData', authMiddleware, personajeController.levelUpData);
router.post('/character/levelUp', authMiddleware, personajeController.levelUp);
router.post('/character/learnSpells', authMiddleware, personajeController.aprenderListaConjuros);
router.post('/character/:id/addForm', authMiddleware, personajeController.addForm);

export default router;