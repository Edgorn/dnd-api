import CampaignService from "../../../domain/services/campaign.service";
import { CampaignJoinInput } from "../../../domain/types/campaign.types";

export default class AcceptJoinCampaign {
  constructor(private readonly campaignService: CampaignService) { }

  execute(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null> {
    return this.campaignService.acceptJoinRequest(data)
  }
}
