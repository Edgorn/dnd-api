import { Router } from "express";
import { campaignController, authMiddleware } from "../../dependencies";
import { validateParams } from "../middlewares/validateSchema";
import { CampaignIdParamsSchema } from "../schemas/campaign.schema";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CampaignUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB del usuario.
 *         name:
 *           type: string
 *           description: Nombre del usuario.
 *     CampaignBasic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la campaña.
 *         name:
 *           type: string
 *           description: Nombre de la campaña.
 *         isMember:
 *           type: boolean
 *           description: Indica si el usuario autenticado es jugador aceptado.
 *         isMaster:
 *           type: boolean
 *           description: Indica si el usuario autenticado es el master.
 *         players:
 *           type: integer
 *           description: Número de jugadores aceptados.
 *         status:
 *           type: string
 *           description: Estado de la campaña.
 *         master:
 *           type: string
 *           description: Nombre del master.
 *         system:
 *           type: string
 *           description: Identificador del sistema de reglas.
 *         initialLevel:
 *           type: integer
 *           description: Nivel inicial de los personajes.
 *         maxPlayers:
 *           type: integer
 *           description: Número máximo de jugadores.
 *         language:
 *           type: string
 *           description: Idioma de la campaña.
 *     CampaignApi:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID de MongoDB de la campaña.
 *         name:
 *           type: string
 *           description: Nombre de la campaña.
 *         description:
 *           type: string
 *           description: Descripción de la campaña.
 *         isMaster:
 *           type: boolean
 *           description: Indica si el usuario autenticado es el master.
 *         players_requesting:
 *           type: array
 *           description: Usuarios que han solicitado unirse. Solo se rellena para el master.
 *           items:
 *             $ref: '#/components/schemas/CampaignUser'
 *         players:
 *           type: array
 *           description: Jugadores aceptados.
 *           items:
 *             $ref: '#/components/schemas/CampaignUser'
 *         characters:
 *           type: array
 *           description: Personajes vinculados a la campaña.
 *           items:
 *             $ref: '#/components/schemas/PersonajeBasico'
 *         master:
 *           type: string
 *           description: Nombre del master.
 *         status:
 *           type: string
 *           description: Estado de la campaña.
 *         system:
 *           type: string
 *           description: Identificador del sistema de reglas.
 *         initialLevel:
 *           type: integer
 *           description: Nivel inicial de los personajes.
 *         maxPlayers:
 *           type: integer
 *           description: Número máximo de jugadores.
 *         language:
 *           type: string
 *           description: Idioma de la campaña.
 *         locations:
 *           type: array
 *           items:
 *             type: string
 *           description: Identificadores de las localizaciones.
 *         initialMapId:
 *           type: string
 *           description: Identificador del mapa inicial.
 */

/**
 * @openapi
 * /campaign:
 *   get:
 *     summary: Listar campañas del usuario autenticado
 *     description: Devuelve las campañas en las que el usuario es master, jugador o ha solicitado unirse. Quien solo ha solicitado entrada aparece con isMember e isMaster en false.
 *     tags:
 *       - Campañas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de campañas del usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CampaignBasic'
 *       401:
 *         description: No autorizado.
 *       500:
 *         description: Error del servidor.
 */
router.get('/campaign', authMiddleware, campaignController.getCampaigns);
router.post('/campaign', authMiddleware, campaignController.createCampaign);

/**
 * @openapi
 * /campaign/{id}:
 *   get:
 *     summary: Obtener una campaña por ID
 *     description: Devuelve el detalle de la campaña. Solo el master o un jugador aceptado pueden acceder.
 *     tags:
 *       - Campañas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB de la campaña.
 *     responses:
 *       200:
 *         description: Detalle de la campaña.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CampaignApi'
 *       400:
 *         description: ID de campaña inválido.
 *       401:
 *         description: No autorizado.
 *       403:
 *         description: El usuario no pertenece a la campaña.
 *       404:
 *         description: Campaña no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get('/campaign/:id', authMiddleware, validateParams(CampaignIdParamsSchema), campaignController.getCampaign);

/**
 * @openapi
 * /campaign/{id}/request-join:
 *   post:
 *     summary: Solicitar unirse a una campaña
 *     description: Crea una solicitud de entrada para el usuario autenticado. No puede solicitar quien ya es master, jugador o tiene una solicitud pendiente, ni si la campaña está llena.
 *     tags:
 *       - Campañas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB de la campaña.
 *     responses:
 *       201:
 *         description: Solicitud de entrada creada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CampaignBasic'
 *       400:
 *         description: ID de campaña inválido.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Campaña no encontrada.
 *       409:
 *         description: Conflicto (ya es miembro, ya solicitó entrada o la campaña está llena).
 *       500:
 *         description: Error del servidor.
 */
router.post('/campaign/:id/request-join', authMiddleware, validateParams(CampaignIdParamsSchema), campaignController.requestJoinCampaign);
router.delete('/campaign/:id/request-join/:userId', authMiddleware, campaignController.denyJoinRequest);
router.post('/campaign/:id/request-join/:userId/accept', authMiddleware, campaignController.acceptJoinRequest);
router.post('/campaign/:id/add-character', authMiddleware, campaignController.addCharacterToCampaign);
router.patch('/campaign/:id/locations', authMiddleware, campaignController.updateCampaignLocations);

export default router;
