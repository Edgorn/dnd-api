import CampaignService from "../../../domain/services/campaign.service";
import { UpdateCampaignLocationsInput } from "../../../domain/types/campaign.types";

export default class UpdateCampaignLocations {
  constructor(private readonly campaignService: CampaignService) { }

  execute(data: UpdateCampaignLocationsInput): Promise<boolean> {
    return this.campaignService.updateLocations(data)
  }
}
