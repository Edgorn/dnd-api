import CrearCampaña from "../../../application/use-cases/campaña/crearCampaña.use-case";
import GetCampaignsByUser from "../../../application/use-cases/campaña/getCampaignsByUser.use-case";
import ObtenerCampañaPorId from "../../../application/use-cases/campaña/obtenerCampañaPorId.use-case";
import SolicitarEntradaACampaña from "../../../application/use-cases/campaña/solicitarEntradaACampaña.use-case";
import AceptarEntradaACampaña from "../../../application/use-cases/campaña/aceptarEntradaACampaña.use-case";
import DenegarEntradaACampaña from "../../../application/use-cases/campaña/denegarEntradaACampaña.use-case";
import AñadirPersonajeACampaña from "../../../application/use-cases/campaña/añadirPersonajeACampaña.use-case";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ModificarLocalizacionesCampaña from "../../../application/use-cases/campaña/modificarLocalizacionesCampaña.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

export class CampañaController {
  constructor(
    private readonly crearCampaña: CrearCampaña,
    private readonly getCampaignsByUser: GetCampaignsByUser,
    private readonly obtenerCampañaPorId: ObtenerCampañaPorId,
    private readonly solicitarEntrada: SolicitarEntradaACampaña,
    private readonly aceptarEntrada: AceptarEntradaACampaña,
    private readonly denegarEntrada: DenegarEntradaACampaña,
    private readonly añadirPersonaje: AñadirPersonajeACampaña,
    private readonly modificarLocalizaciones: ModificarLocalizacionesCampaña
  ) { }

  getCampaigns = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.getCampaignsByUser.execute(req.user!)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  createCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.crearCampaña.execute({ ...req.body, master: req.user! });
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  getCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Se requiere el ID de la campaña');
      }

      const data = await this.obtenerCampañaPorId.execute(req.user!, id)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  requestJoinCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Se requiere el ID de la campaña');
      }

      const data = await this.solicitarEntrada.execute(req.user!, id)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  denyJoinRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, userId } = req.params;

      if (!id) {
        throw new ValidationError('Se requiere el ID de la campaña');
      }

      if (!userId) {
        throw new ValidationError('Se requiere el ID del usuario');
      }

      const data = await this.denegarEntrada.execute({ masterId: req.user!, campaignId: id, userId })
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  acceptJoinRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, userId } = req.params;

      if (!id) {
        throw new ValidationError('Se requiere el ID de la campaña');
      }

      if (!userId) {
        throw new ValidationError('Se requiere el ID del usuario');
      }

      const data = await this.aceptarEntrada.execute({ masterId: req.user!, campaignId: id, userId })
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  addCharacterToCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { characterId } = req.body;

      if (!id) {
        throw new ValidationError('Se requiere el ID de la campaña');
      }

      if (!characterId) {
        throw new ValidationError('Se requiere el ID del personaje');
      }

      const data = await this.añadirPersonaje.execute({ userId: req.user!, campaignId: id, characterId })
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  updateCampaignLocations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { locations, initialMapId } = req.body;
      const userId = req.user!;

      if (!Array.isArray(locations) || !initialMapId) {
        throw new ValidationError("Datos de localizaciones inválidos");
      }

      const updatedCampaign = await this.modificarLocalizaciones.execute({
        campaignId: id,
        userId,
        locations,
        initialMapId
      });

      return res.status(200).json(updatedCampaign);
    } catch (e) {
      next(e);
    }
  };
}