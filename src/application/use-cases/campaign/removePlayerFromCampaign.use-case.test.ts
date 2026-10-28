import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import RemovePlayerFromCampaign from "./removePlayerFromCampaign.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import CharacterService from "../../../domain/services/character.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignMongo, RemovePlayerFromCampaignInput } from "../../../domain/types/campaign.types";
import { CharacterBasic } from "../../../domain/types/character.types";

const campaignId = new Types.ObjectId().toString();
const characterId = new Types.ObjectId().toString();
const otherCharacterId = new Types.ObjectId().toString();

const input: RemovePlayerFromCampaignInput = {
  callerId: "player-1",
  campaignId,
  userId: "player-1",
};

const removeResult = { userId: "player-1", campaignId };

const baseCampaign: CampaignMongo = {
  _id: new Types.ObjectId(campaignId),
  name: "Lost Mine",
  description: "A mining adventure",
  master: "master-1",
  status: "Activa",
  players_requesting: [],
  players: ["player-1", "player-2"],
  characters: [characterId, otherCharacterId],
  system: "dnd5e",
  initialLevel: 1,
  maxPlayers: 5,
  language: "es",
  deletedAt: null,
};

const ownedCharacter = { id: characterId, user: "Ada", userId: "player-1" } as CharacterBasic;
const otherCharacter = { id: otherCharacterId, user: "Bea", userId: "player-2" } as CharacterBasic;

const createCampaignService = (overrides: Partial<CampaignService> = {}) =>
  ({
    findActiveById: vi.fn().mockResolvedValue(baseCampaign),
    removePlayer: vi.fn().mockResolvedValue(removeResult),
    ...overrides,
  }) as unknown as CampaignService;

const createCharacterService = (overrides: Partial<CharacterService> = {}) =>
  ({
    getByIds: vi.fn().mockResolvedValue([ownedCharacter, otherCharacter]),
    unassignFromCampaign: vi.fn().mockResolvedValue({ characterId }),
    ...overrides,
  }) as unknown as CharacterService;

describe("RemovePlayerFromCampaign UseCase", () => {
  it("should let a player leave and unassign only their characters", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    const result = await useCase.execute(input);

    expect(characterService.getByIds).toHaveBeenCalledWith([characterId, otherCharacterId]);
    expect(characterService.unassignFromCampaign).toHaveBeenCalledTimes(1);
    expect(characterService.unassignFromCampaign).toHaveBeenCalledWith(characterId, campaignId);
    expect(campaignService.removePlayer).toHaveBeenCalledWith(campaignId, "player-1", [characterId]);
    expect(result).toEqual(removeResult);
  });

  it("should let the master kick a player and unassign that player's characters", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    const result = await useCase.execute({
      callerId: "master-1",
      campaignId,
      userId: "player-1",
    });

    expect(characterService.unassignFromCampaign).toHaveBeenCalledWith(characterId, campaignId);
    expect(campaignService.removePlayer).toHaveBeenCalledWith(campaignId, "player-1", [characterId]);
    expect(result).toEqual(removeResult);
  });

  it("should unassign every character belonging to the removed player", async () => {
    const extraId = new Types.ObjectId().toString();
    const extraCharacter = { id: extraId, user: "Ada", userId: "player-1" } as CharacterBasic;
    const campaignService = createCampaignService({
      findActiveById: vi.fn().mockResolvedValue({
        ...baseCampaign,
        characters: [characterId, extraId, otherCharacterId],
      }),
    });
    const characterService = createCharacterService({
      getByIds: vi.fn().mockResolvedValue([ownedCharacter, extraCharacter, otherCharacter]),
    });
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    await useCase.execute({ callerId: "master-1", campaignId, userId: "player-1" });

    expect(characterService.unassignFromCampaign).toHaveBeenCalledTimes(2);
    expect(campaignService.removePlayer).toHaveBeenCalledWith(
      campaignId,
      "player-1",
      [characterId, extraId]
    );
  });

  it("should remove a player with no characters without calling getByIds", async () => {
    const campaignService = createCampaignService({
      findActiveById: vi.fn().mockResolvedValue({ ...baseCampaign, characters: [] }),
    });
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    await useCase.execute(input);

    expect(characterService.getByIds).not.toHaveBeenCalled();
    expect(characterService.unassignFromCampaign).not.toHaveBeenCalled();
    expect(campaignService.removePlayer).toHaveBeenCalledWith(campaignId, "player-1", []);
  });

  it("should throw NotFoundError when the campaign does not exist", async () => {
    const campaignService = createCampaignService({
      findActiveById: vi.fn().mockResolvedValue(null),
    });
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(campaignService.removePlayer).not.toHaveBeenCalled();
  });

  it("should throw AppError 403 when trying to remove the master", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    await expect(
      useCase.execute({ callerId: "master-1", campaignId, userId: "master-1" })
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(campaignService.removePlayer).not.toHaveBeenCalled();
  });

  it("should throw AppError 403 when an outsider tries to remove a player", async () => {
    const campaignService = createCampaignService();
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    await expect(
      useCase.execute({ callerId: "outsider", campaignId, userId: "player-1" })
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(campaignService.removePlayer).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when the user is not an accepted player", async () => {
    const campaignService = createCampaignService({
      findActiveById: vi.fn().mockResolvedValue({ ...baseCampaign, players: ["player-2"] }),
    });
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(campaignService.removePlayer).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when persistence returns null", async () => {
    const campaignService = createCampaignService({
      removePlayer: vi.fn().mockResolvedValue(null),
    });
    const characterService = createCharacterService();
    const useCase = new RemovePlayerFromCampaign(campaignService, characterService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
  });
});
