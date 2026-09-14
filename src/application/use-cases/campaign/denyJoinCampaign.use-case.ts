import CampaignService from "../../../domain/services/campaign.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignJoinInput } from "../../../domain/types/campaign.types";

export default class DenyJoinCampaign {
  constructor(private readonly campaignService: CampaignService) { }

  async execute(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string }> {
    const campaign = await this.campaignService.findActiveById(data.campaignId);

    if (!campaign) {
      throw new NotFoundError("Campaña no encontrada");
    }

    if (campaign.master !== data.masterId) {
      throw new AppError("No tienes permisos para denegar solicitudes", 403);
    }

    const requesting = Array.isArray(campaign.players_requesting) ? campaign.players_requesting : [];

    if (!requesting.includes(data.userId)) {
      throw new NotFoundError("El usuario no ha solicitado entrar en la campaña");
    }

    const result = await this.campaignService.denyJoinRequest(data);

    if (!result) {
      throw new NotFoundError("Campaña no encontrada");
    }

    return result;
  }
}
