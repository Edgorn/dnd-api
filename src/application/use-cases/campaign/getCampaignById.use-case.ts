import CampaignService from "../../../domain/services/campaign.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignApi } from "../../../domain/types/campaign.types";

export default class GetCampaignById {
  constructor(private readonly campaignService: CampaignService) { }

  async execute(userId: string, campaignId: string): Promise<CampaignApi> {
    const campaign = await this.campaignService.findActiveById(campaignId);

    if (!campaign) {
      throw new NotFoundError("Campaña no encontrada");
    }

    const players = Array.isArray(campaign.players) ? campaign.players : [];
    const isMember = campaign.master === userId || players.includes(userId);

    if (!isMember) {
      throw new AppError("No perteneces a la campaña", 403);
    }

    return this.campaignService.getDetail(userId, campaign);
  }
}
