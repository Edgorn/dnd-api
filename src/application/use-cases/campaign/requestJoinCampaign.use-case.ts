import CampaignService from "../../../domain/services/campaign.service";
import { ConflictError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignBasic } from "../../../domain/types/campaign.types";

export default class RequestJoinCampaign {
  constructor(private readonly campaignService: CampaignService) { }

  async execute(userId: string, campaignId: string): Promise<CampaignBasic> {
    const campaign = await this.campaignService.findActiveById(campaignId);

    if (!campaign) {
      throw new NotFoundError("Campaña no encontrada");
    }

    const players = Array.isArray(campaign.players) ? campaign.players : [];
    const requesting = Array.isArray(campaign.players_requesting) ? campaign.players_requesting : [];

    if (requesting.includes(userId)) {
      throw new ConflictError("El usuario ya ha pedido entrar en la campaña");
    }

    if (players.includes(userId)) {
      throw new ConflictError("El usuario ya pertenece a la campaña");
    }

    if (campaign.master === userId) {
      throw new ConflictError("El usuario ya es el master de la campaña");
    }

    if (players.length >= campaign.maxPlayers) {
      throw new ConflictError("La campaña ya tiene el máximo de jugadores");
    }

    const result = await this.campaignService.registerJoinRequest(userId, campaignId);

    if (!result) {
      throw new NotFoundError("Campaña no encontrada");
    }

    return result;
  }
}
