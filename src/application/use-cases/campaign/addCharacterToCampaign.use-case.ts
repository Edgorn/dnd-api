import CampaignService from "../../../domain/services/campaign.service";
import CharacterService from "../../../domain/services/character.service";
import { AppError, ConflictError, NotFoundError } from "../../../domain/errors/AppError";
import { AddCharacterToCampaignInput } from "../../../domain/types/campaign.types";

export default class AddCharacterToCampaign {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly characterService: CharacterService
  ) { }

  async execute(data: AddCharacterToCampaignInput): Promise<{ characterId: string }> {
    const { userId, campaignId, characterId } = data;

    const campaign = await this.campaignService.findActiveById(campaignId);

    if (!campaign) {
      throw new NotFoundError("Campaña no encontrada");
    }

    const players = Array.isArray(campaign.players) ? campaign.players : [];
    const isMember = campaign.master === userId || players.includes(userId);

    if (!isMember) {
      throw new AppError("No perteneces a la campaña", 403);
    }

    const character = await this.characterService.getCampaignLink(characterId);

    if (!character) {
      throw new NotFoundError("Personaje no encontrado");
    }

    if (character.userId !== userId) {
      throw new AppError("El personaje no pertenece al usuario", 403);
    }

    const characters = Array.isArray(campaign.characters) ? campaign.characters : [];

    if (characters.includes(characterId) || character.campaign === campaignId) {
      throw new ConflictError("El personaje ya pertenece a esta campaña");
    }

    if (character.campaign) {
      throw new ConflictError("El personaje ya pertenece a otra campaña");
    }

    const assigned = await this.characterService.assignToCampaign(characterId, campaignId);

    if (!assigned) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const result = await this.campaignService.addCharacter(campaignId, characterId);

    if (!result) {
      throw new NotFoundError("Campaña no encontrada");
    }

    return result;
  }
}
