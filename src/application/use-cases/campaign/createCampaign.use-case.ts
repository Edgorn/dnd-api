import CampaignService from "../../../domain/services/campaign.service";
import { AppError } from "../../../domain/errors/AppError";
import { CampaignBasic, CreateCampaignInput } from "../../../domain/types/campaign.types";

export default class CreateCampaign {
  constructor(private readonly campaignService: CampaignService) { }

  async execute(data: CreateCampaignInput): Promise<CampaignBasic> {
    const result = await this.campaignService.create(data);

    if (!result) {
      throw new AppError("No se pudo crear la campaña", 500);
    }

    return result;
  }
}
