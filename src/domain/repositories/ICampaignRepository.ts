import { CampaignApi, CampaignBasic, CampaignMongo, CreateCampaignInput, CampaignJoinInput, AddCharacterToCampaignInput, UpdateCampaignLocationsInput } from "../types/campaign.types";

export default interface ICampaignRepository {
  getByUser(id: string): Promise<CampaignBasic[]>
  create(data: CreateCampaignInput): Promise<CampaignBasic | null>
  findActiveById(id: string): Promise<CampaignMongo | null>
  getDetail(userId: string, campaign: CampaignMongo): Promise<CampaignApi>
  registerJoinRequest(userId: string, campaignId: string): Promise<CampaignBasic | null>
  denyJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null>
  acceptJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null>
  addCharacter(data: AddCharacterToCampaignInput): Promise<{ characterId: string } | null>
  updateLocations(data: UpdateCampaignLocationsInput): Promise<boolean>
}
