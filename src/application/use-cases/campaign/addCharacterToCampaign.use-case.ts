import CampaignService from "../../../domain/services/campaign.service";
import { AddCharacterToCampaignInput } from "../../../domain/types/campaign.types";

export default class AddCharacterToCampaign {
  constructor(private readonly campaignService: CampaignService) { }

  execute(data: AddCharacterToCampaignInput): Promise<{ characterId: string } | null> {
    return this.campaignService.addCharacter(data)
  }
}
