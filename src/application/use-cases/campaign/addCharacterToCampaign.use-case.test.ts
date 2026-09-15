import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import AddCharacterToCampaign from "./addCharacterToCampaign.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import PersonajeService from "../../../domain/services/personaje.service";
import { AppError, ConflictError, NotFoundError } from "../../../domain/errors/AppError";
import { AddCharacterToCampaignInput, CampaignMongo } from "../../../domain/types/campaign.types";
import { CharacterCampaignLink, PersonajeBasico } from "../../../domain/types/personajes.types";

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
  characters: [],
  system: "dnd5e",
  initialLevel: 1,
  maxPlayers: 5,
  language: "es",
  deletedAt: null,
};

const characterLink: CharacterCampaignLink = {
  id: characterId,
  userId: "player-1",
  campaign: null,
};

const assignedCharacter = { id: characterId } as PersonajeBasico;
const addResult = { characterId };

const createCampaignService = (overrides: Partial<CampaignService> = {}) =>
  ({
    findActiveById: vi.fn().mockResolvedValue(baseCampaign),
    addCharacter: vi.fn().mockResolvedValue(addResult),
    ...overrides,
  }) as unknown as CampaignService;

const createPersonajeService = (overrides: Partial<PersonajeService> = {}) =>
  ({
    getCampaignLink: vi.fn().mockResolvedValue(characterLink),
    assignToCampaign: vi.fn().mockResolvedValue(assignedCharacter),
    ...overrides,
  }) as unknown as PersonajeService;

describe("AddCharacterToCampaign UseCase", () => {
  it("should add a character when the caller is a player and owns the character", async () => {
    const campaignService = createCampaignService();
    const personajeService = createPersonajeService();
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    const result = await useCase.execute(input);

    expect(campaignService.findActiveById).toHaveBeenCalledWith(campaignId);
    expect(personajeService.getCampaignLink).toHaveBeenCalledWith(characterId);
    expect(personajeService.assignToCampaign).toHaveBeenCalledWith(characterId, campaignId);
    expect(campaignService.addCharacter).toHaveBeenCalledWith(campaignId, characterId);
    expect(result).toEqual(addResult);
  });

  it("should add a character when the caller is the master and owns the character", async () => {
    const campaignService = createCampaignService();
    const personajeService = createPersonajeService({
      getCampaignLink: vi.fn().mockResolvedValue({ ...characterLink, userId: "master-1" }),
    });
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    const result = await useCase.execute({ ...input, userId: "master-1" });

    expect(personajeService.assignToCampaign).toHaveBeenCalled();
    expect(campaignService.addCharacter).toHaveBeenCalled();
    expect(result).toEqual(addResult);
  });

  it("should throw NotFoundError when the campaign does not exist", async () => {
    const campaignService = createCampaignService({
      findActiveById: vi.fn().mockResolvedValue(null),
    });
    const personajeService = createPersonajeService();
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(personajeService.getCampaignLink).not.toHaveBeenCalled();
    expect(personajeService.assignToCampaign).not.toHaveBeenCalled();
    expect(campaignService.addCharacter).not.toHaveBeenCalled();
  });

  it("should throw AppError 403 when the caller is not a campaign member", async () => {
    const campaignService = createCampaignService();
    const personajeService = createPersonajeService();
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    await expect(useCase.execute({ ...input, userId: "outsider" })).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(personajeService.assignToCampaign).not.toHaveBeenCalled();
    expect(campaignService.addCharacter).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when the character does not exist", async () => {
    const campaignService = createCampaignService();
    const personajeService = createPersonajeService({
      getCampaignLink: vi.fn().mockResolvedValue(null),
    });
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(NotFoundError);
    expect(personajeService.assignToCampaign).not.toHaveBeenCalled();
    expect(campaignService.addCharacter).not.toHaveBeenCalled();
  });

  it("should throw AppError 403 when the character does not belong to the caller", async () => {
    const campaignService = createCampaignService();
    const personajeService = createPersonajeService({
      getCampaignLink: vi.fn().mockResolvedValue({ ...characterLink, userId: "other-user" }),
    });
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    await expect(useCase.execute(input)).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(personajeService.assignToCampaign).not.toHaveBeenCalled();
    expect(campaignService.addCharacter).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the character is already in this campaign", async () => {
    const campaignService = createCampaignService({
      findActiveById: vi.fn().mockResolvedValue({ ...baseCampaign, characters: [characterId] }),
    });
    const personajeService = createPersonajeService();
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictError);
    expect(personajeService.assignToCampaign).not.toHaveBeenCalled();
    expect(campaignService.addCharacter).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the character already belongs to another campaign", async () => {
    const campaignService = createCampaignService();
    const personajeService = createPersonajeService({
      getCampaignLink: vi.fn().mockResolvedValue({
        ...characterLink,
        campaign: new Types.ObjectId().toString(),
      }),
    });
    const useCase = new AddCharacterToCampaign(campaignService, personajeService);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictError);
    expect(personajeService.assignToCampaign).not.toHaveBeenCalled();
    expect(campaignService.addCharacter).not.toHaveBeenCalled();
  });
});
