import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import RemoveCharacterFromCampaign from "./removeCharacterFromCampaign.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import CharacterService from "../../../domain/services/character.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { AddCharacterToCampaignInput, CampaignMongo } from "../../../domain/types/campaign.types";
import { CharacterCampaignLink } from "../../../domain/types/character.types";

const campaignId = new Types.ObjectId().toString();
const characterId = new Types.ObjectId().toString();

const input: AddCharacterToCampaignInput = {
  userId: "player-1",
  campaignId,
  characterId,
};

const baseCampaign: CampaignMongo = {
  _id: new Types.ObjectId(campaignId),
  name: "Lost Mine",
  description: "A mining adventure",
  master: "master-1",
  status: "Activa",
  players_requesting: [],
  players: ["player-1"],
  characters: [characterId],
  system: "dnd5e",
  initialLevel: 1,
  maxPlayers: 5,
  language: "es",
  deletedAt: null,
};

const characterLink: CharacterCampaignLink = {
  id: characterId,
  userId: "player-1",
  campaign: campaignId,
};

const removeResult = { characterId };

const createCampaignService = (overrides: Partial<CampaignService> = {}) =>
  ({
    findActiveById: vi.fn().mockResolvedValue(baseCampaign),
    removeCharacter: vi.fn().mockResolvedValue(removeResult),
    ...overrides,
  }) as unknown as CampaignService;

const createCharacterService = (overrides: Partial<CharacterService> = {}) =>
  ({
    getCampaignLink: vi.fn().mockResolvedValue(characterLink),
    unassignFromCampaign: vi.fn().mockResolvedValue(removeResult),
    ...overrides,
  }) as unknown as CharacterService;

describe("RemoveCharacterFromCampaign UseCase", () => {
  it("should unassign the character when the caller owns it", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService();
    const useCase = new RemoveCharacterFromCampaign(campaignService, characterService);

    const result = await useCase.execute(input);

    expect(campaignService.findActiveById).toHaveBeenCalledWith(campaignId);
    expect(characterService.getCampaignLink).toHaveBeenCalledWith(characterId);
    expect(characterService.unassignFromCampaign).toHaveBeenCalledWith(characterId, campaignId);
    expect(campaignService.removeCharacter).toHaveBeenCalledWith(campaignId, characterId);
    expect(result).toEqual(removeResult);
  });

  it("should throw NotFoundError when the campaign does not exist", async () => {
    const campaignService = createCampaignService({
      findActiveById: vi.fn().mockResolvedValue(null),
    });
    const characterService = createCharacterService();
    const useCase = new RemoveCharacterFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(characterService.unassignFromCampaign).not.toHaveBeenCalled();
    expect(campaignService.removeCharacter).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when the character does not exist", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService({
      getCampaignLink: vi.fn().mockResolvedValue(null),
    });
    const useCase = new RemoveCharacterFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(characterService.unassignFromCampaign).not.toHaveBeenCalled();
  });

  it("should throw AppError 403 when the caller does not own the character", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService({
      getCampaignLink: vi.fn().mockResolvedValue({ ...characterLink, userId: "other-user" }),
    });
    const useCase = new RemoveCharacterFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(characterService.unassignFromCampaign).not.toHaveBeenCalled();
    expect(campaignService.removeCharacter).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when the character is not in this campaign", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService({
      getCampaignLink: vi.fn().mockResolvedValue({ ...characterLink, campaign: null }),
    });
    const useCase = new RemoveCharacterFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(characterService.unassignFromCampaign).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when unassign returns null", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService({
      unassignFromCampaign: vi.fn().mockResolvedValue(null),
    });
    const useCase = new RemoveCharacterFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(campaignService.removeCharacter).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when campaign persistence returns null", async () => {
    const campaignService = createCampaignService({
      removeCharacter: vi.fn().mockResolvedValue(null),
    });
    const characterService = createCharacterService();
    const useCase = new RemoveCharacterFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
  });
});
