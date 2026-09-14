import CampaignService from "../../../domain/services/campaign.service";
import { AppError, ConflictError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignJoinInput } from "../../../domain/types/campaign.types";

export default class AcceptJoinCampaign {
  constructor(private readonly campaignService: CampaignService) { }

  async execute(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string }> {
    const campaign = await this.campaignService.findActiveById(data.campaignId);

    if (!campaign) {
      throw new NotFoundError("Campaña no encontrada");
    }

    if (campaign.master !== data.masterId) {
      throw new AppError("No tienes permisos para aceptar solicitudes", 403);
    }

    const requesting = Array.isArray(campaign.players_requesting) ? campaign.players_requesting : [];
    const players = Array.isArray(campaign.players) ? campaign.players : [];

    if (!requesting.includes(data.userId)) {
      throw new NotFoundError("El usuario no ha solicitado entrar en la campaña");
    }

    if (players.includes(data.userId)) {
      throw new ConflictError("El usuario ya pertenece a la campaña");
    }

    if (players.length >= campaign.maxPlayers) {
      throw new ConflictError("La campaña ya tiene el máximo de jugadores");
    }

    const result = await this.campaignService.acceptJoinRequest(data);

    if (!result) {
      throw new NotFoundError("Campaña no encontrada");
    }

    return result;
  }
}
