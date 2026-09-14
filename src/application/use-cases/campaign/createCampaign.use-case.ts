import CampaignService from "../../../domain/services/campaign.service";
import { CampaignBasic, CreateCampaignInput } from "../../../domain/types/campaign.types";

export default class CreateCampaign {
  constructor(private readonly campaignService: CampaignService) { }

  execute(data: CreateCampaignInput): Promise<CampaignBasic | null> {
    return this.campaignService.create(data)
  }
}
