import ICampaignRepository from "../repositories/ICampaignRepository";
import { CampaignApi, CampaignBasic, CampaignMongo, CreateCampaignInput, CampaignJoinInput, AddCharacterToCampaignInput, UpdateCampaignLocationsInput } from "../types/campaign.types";

export default class CampaignService {
  constructor(private readonly campaignRepository: ICampaignRepository) { }

  getByUser(id: string): Promise<CampaignBasic[]> {
    return this.campaignRepository.getByUser(id);
  }

  create(data: CreateCampaignInput): Promise<CampaignBasic | null> {
    return this.campaignRepository.create(data);
  }

  findActiveById(id: string): Promise<CampaignMongo | null> {
    return this.campaignRepository.findActiveById(id);
  }

  getDetail(userId: string, campaign: CampaignMongo): Promise<CampaignApi> {
    return this.campaignRepository.getDetail(userId, campaign);
  }

  registerJoinRequest(userId: string, campaignId: string): Promise<CampaignBasic | null> {
    return this.campaignRepository.registerJoinRequest(userId, campaignId);
  }

  denyJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null> {
    return this.campaignRepository.denyJoinRequest(data);
  }

  acceptJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null> {
    return this.campaignRepository.acceptJoinRequest(data);
  }

  addCharacter(data: AddCharacterToCampaignInput): Promise<{ characterId: string } | null> {
    return this.campaignRepository.addCharacter(data);
  }

  async updateLocations(data: UpdateCampaignLocationsInput): Promise<boolean> {
    return this.campaignRepository.updateLocations(data);
  }
}
