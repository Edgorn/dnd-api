import CampaignService from "../../../domain/services/campaign.service";
import CharacterService from "../../../domain/services/character.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { AddCharacterToCampaignInput } from "../../../domain/types/campaign.types";

export default class RemoveCharacterFromCampaign {
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

    const character = await this.characterService.getCampaignLink(characterId);

    if (!character) {
      throw new NotFoundError("Personaje no encontrado");
    }

    if (character.userId !== userId) {
      throw new AppError("El personaje no pertenece al usuario", 403);
    }

    if (character.campaign !== campaignId) {
      throw new NotFoundError("El personaje no pertenece a esta campaña");
    }

    const unassigned = await this.characterService.unassignFromCampaign(characterId, campaignId);

    if (!unassigned) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const result = await this.campaignService.removeCharacter(campaignId, characterId);

    if (!result) {
      throw new NotFoundError("Campaña no encontrada");
    }

    return result;
  }
}
