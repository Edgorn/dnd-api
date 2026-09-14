import CampaignService from "../../../domain/services/campaign.service";
import { CampaignBasic } from "../../../domain/types/campaign.types";

export default class GetCampaignsByUser {
  constructor(private readonly campaignService: CampaignService) { }

  execute(id: string): Promise<CampaignBasic[]> {
    return this.campaignService.getByUser(id)
  }
}
