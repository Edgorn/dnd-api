import CreateCampaign from "../../../application/use-cases/campaign/createCampaign.use-case";
import GetCampaignsByUser from "../../../application/use-cases/campaign/getCampaignsByUser.use-case";
import GetCampaignById from "../../../application/use-cases/campaign/getCampaignById.use-case";
import RequestJoinCampaign from "../../../application/use-cases/campaign/requestJoinCampaign.use-case";
import AcceptJoinCampaign from "../../../application/use-cases/campaign/acceptJoinCampaign.use-case";
import DenyJoinCampaign from "../../../application/use-cases/campaign/denyJoinCampaign.use-case";
import AddCharacterToCampaign from "../../../application/use-cases/campaign/addCharacterToCampaign.use-case";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import UpdateCampaignLocations from "../../../application/use-cases/campaign/updateCampaignLocations.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

export class CampaignController {
  constructor(
    private readonly createCampaignUseCase: CreateCampaign,
    private readonly getCampaignsByUser: GetCampaignsByUser,
    private readonly getCampaignById: GetCampaignById,
    private readonly requestJoin: RequestJoinCampaign,
    private readonly acceptJoin: AcceptJoinCampaign,
    private readonly denyJoin: DenyJoinCampaign,
    private readonly addCharacter: AddCharacterToCampaign,
    private readonly updateLocations: UpdateCampaignLocations
  ) { }

  getCampaigns = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user;

      if (!userId) {
        throw new ValidationError("User ID is required");
      }

      const data = await this.getCampaignsByUser.execute(userId)
      return res.status(200).json(data);
    } catch (e) {
      console.error("[CampaignController.getCampaigns] Error:", e);
      next(e);
    }
  };

  createCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user;

      if (!userId) {
        throw new ValidationError("User ID is required");
      }

      const { name, description, system, initialLevel, maxPlayers, language } = req.body;
      const data = await this.createCampaignUseCase.execute({
        name,
        description,
        system,
        initialLevel,
        maxPlayers,
        language,
        master: userId
      });

      return res.status(201).json(data);
    } catch (e) {
      console.error("[CampaignController.createCampaign] Error:", e);
      next(e);
    }
  };

  getCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user;
      const { id } = req.params;

      if (!userId) {
        throw new ValidationError("User ID is required");
      }

      const data = await this.getCampaignById.execute(userId, id);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[CampaignController.getCampaign] Error:", e);
      next(e);
    }
  };

  requestJoinCampaign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user;
      const { id } = req.params;

      if (!userId) {
        throw new ValidationError("User ID is required");
      }

      const data = await this.requestJoin.execute(userId, id);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[CampaignController.requestJoinCampaign] Error:", e);
      next(e);
    }
  };

  denyJoinRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const masterId = req.user;
      const { id, userId } = req.params;

      if (!masterId) {
        throw new ValidationError("User ID is required");
      }

      const data = await this.denyJoin.execute({ masterId, campaignId: id, userId });
      return res.status(200).json(data);
    } catch (e) {
      console.error("[CampaignController.denyJoinRequest] Error:", e);
      next(e);
    }
  };

  acceptJoinRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const masterId = req.user;
      const { id, userId } = req.params;

      if (!masterId) {
        throw new ValidationError("User ID is required");
      }

      const data = await this.acceptJoin.execute({ masterId, campaignId: id, userId });
      return res.status(200).json(data);
    } catch (e) {
      console.error("[CampaignController.acceptJoinRequest] Error:", e);
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

      const data = await this.addCharacter.execute({ userId: req.user!, campaignId: id, characterId })
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

      const updatedCampaign = await this.updateLocations.execute({
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
