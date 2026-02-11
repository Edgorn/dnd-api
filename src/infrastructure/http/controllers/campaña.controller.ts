import CrearCampaña from "../../../application/use-cases/campaña/crearCampaña.use-case";
import ObtenerCampañasPorUsuario from "../../../application/use-cases/campaña/obtenerCampañasPorUsuario.use-case";
import ObtenerCampañaPorId from "../../../application/use-cases/campaña/obtenerCampañaPorId.use-case";
import SolicitarEntradaACampaña from "../../../application/use-cases/campaña/solicitarEntradaACampaña.use-case";
import AceptarEntradaACampaña from "../../../application/use-cases/campaña/aceptarEntradaACampaña.use-case";
import DenegarEntradaACampaña from "../../../application/use-cases/campaña/denegarEntradaACampaña.use-case";
import AñadirPersonajeACampaña from "../../../application/use-cases/campaña/añadirPersonajeACampaña.use-case";
import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ModificarLocalizacionesCampaña from "../../../application/use-cases/campaña/modificarLocalizacionesCampaña.use-case";

export class CampañaController {
  constructor(
    private readonly crearCampaña: CrearCampaña,
    private readonly obtenerCampañasPorUsuario: ObtenerCampañasPorUsuario,
    private readonly obtenerCampañaPorId: ObtenerCampañaPorId,
    private readonly solicitarEntrada: SolicitarEntradaACampaña,
    private readonly aceptarEntrada: AceptarEntradaACampaña,
    private readonly denegarEntrada: DenegarEntradaACampaña,
    private readonly añadirPersonaje: AñadirPersonajeACampaña,
    private readonly modificarLocalizaciones: ModificarLocalizacionesCampaña
  ) { }

  getCampaigns = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.obtenerCampañasPorUsuario.execute(req.user!)
      res.status(200).json(data);
    } catch (e) {
      this.handleError(res, e, 'Error al consultar campañas');
    }
  };

  createCampaign = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.crearCampaña.execute({ ...req.body, master: req.user! });
      res.status(201).json(data);
    } catch (e) {
      this.handleError(res, e, 'Error al crear campaña');
    }
  };

  getCampaign = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
      }

      const data = await this.obtenerCampañaPorId.execute(req.user!, id)
      res.status(200).json(data);
    } catch (e) {
      this.handleError(res, e, 'Error al consultar campañas');
    }
  };

  requestJoinCampaign = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
      }

      const data = await this.solicitarEntrada.execute(req.user!, id)
      res.status(200).json(data);
    } catch (e) {
      this.handleError(res, e, 'Error al solicitar entrada a la campaña');
    }
  };

  denyJoinRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, userId } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
      }

      if (!userId) {
        return res.status(400).json({ error: 'Se requiere el ID del usuario' });
      }

      const data = await this.denegarEntrada.execute({ masterId: req.user!, campaignId: id, userId })
      res.status(200).json(data);
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Error al denegar solicitud' });
    }
  };

  acceptJoinRequest = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, userId } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
      }

      if (!userId) {
        return res.status(400).json({ error: 'Se requiere el ID del usuario' });
      }

      const data = await this.aceptarEntrada.execute({ masterId: req.user!, campaignId: id, userId })
      res.status(200).json(data);
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Error al aceptar solicitud' });
    }
  };

  addCharacterToCampaign = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { characterId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID de la campaña' });
      }

      if (!characterId) {
        return res.status(400).json({ error: 'Se requiere el ID del personaje' });
      }

      const data = await this.añadirPersonaje.execute({ userId: req.user!, campaignId: id, characterId })
      res.status(200).json(data);
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Error al denegar solicitud' });
    }
  };

  updateCampaignLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { locations, initialMapId } = req.body;
      const userId = req.user!;

      if (!Array.isArray(locations) || !initialMapId) {
        return res.status(400).json({ message: "Datos de localizaciones inválidos" });
      }

      const updatedCampaign = await this.modificarLocalizaciones.execute({
        campaignId: id,
        userId,
        locations,
        initialMapId
      });

      return res.status(200).json(updatedCampaign);
    } catch (error: any) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  };

  private handleError(res: Response, e: any, message: string) {
    console.error(e);
    res.status(500).json({ error: message });
  }
}