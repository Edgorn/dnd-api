import CampaignService from "../../../domain/services/campaign.service";
import CharacterService from "../../../domain/services/character.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { RemovePlayerFromCampaignInput } from "../../../domain/types/campaign.types";

export default class RemovePlayerFromCampaign {
  constructor(
    private readonly campaignService: CampaignService,
    private readonly characterService: CharacterService
  ) { }

  async execute(data: RemovePlayerFromCampaignInput): Promise<{ userId: string, campaignId: string }> {
    const { callerId, campaignId, userId } = data;

    const campaign = await this.campaignService.findActiveById(campaignId);

    if (!campaign) {
      throw new NotFoundError("Campaña no encontrada");
    }

    if (userId === campaign.master) {
      throw new AppError("No se puede sacar al master de la campaña", 403);
    }

    const isMaster = campaign.master === callerId;
    const isSelf = callerId === userId;

    if (!isMaster && !isSelf) {
      throw new AppError("No tienes permisos para sacar a este jugador", 403);
    }

    const players = Array.isArray(campaign.players) ? campaign.players : [];

    if (!players.includes(userId)) {
      throw new NotFoundError("El usuario no es un jugador de la campaña");
    }

    const campaignCharacters = Array.isArray(campaign.characters) ? campaign.characters : [];
    const characters = campaignCharacters.length > 0
      ? await this.characterService.getByIds(campaignCharacters)
      : [];
    const ownedIds = characters
      .filter(character => character.userId === userId)
      .map(character => character.id);

    for (const ownedId of ownedIds) {
      await this.characterService.unassignFromCampaign(ownedId, campaignId);
    }

    const result = await this.campaignService.removePlayer(campaignId, userId, ownedIds);

    if (!result) {
      throw new NotFoundError("Campaña no encontrada");
    }

    return result;
  }
}
