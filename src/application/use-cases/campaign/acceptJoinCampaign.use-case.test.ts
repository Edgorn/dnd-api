import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import AcceptJoinCampaign from "./acceptJoinCampaign.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import { AppError, ConflictError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignJoinInput, CampaignMongo } from "../../../domain/types/campaign.types";

const campaignId = new Types.ObjectId().toString();

const joinInput: CampaignJoinInput = {
  masterId: "master-1",
  campaignId,
  userId: "user-2",
};

const joinResult = { userId: joinInput.userId, campaignId };

const baseCampaign: CampaignMongo = {
  _id: new Types.ObjectId(campaignId),
  name: "Lost Mine",
  description: "A mining adventure",
  master: "master-1",
  status: "Activa",
  players_requesting: ["user-2"],
  players: ["player-1"],
  characters: [],
  system: "dnd5e",
  initialLevel: 1,
  maxPlayers: 5,
  language: "es",
  locations: [],
  initialMapId: "",
  deletedAt: null,
};

describe("AcceptJoinCampaign UseCase", () => {
  it("should accept a pending join request when the caller is the master", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(baseCampaign),
      acceptJoinRequest: vi.fn().mockResolvedValue(joinResult),
    } as unknown as CampaignService;

    const useCase = new AcceptJoinCampaign(mockCampaignService);
    const result = await useCase.execute(joinInput);

    expect(mockCampaignService.findActiveById).toHaveBeenCalledWith(campaignId);
    expect(mockCampaignService.acceptJoinRequest).toHaveBeenCalledWith(joinInput);
    expect(result).toEqual(joinResult);
  });

  it("should throw NotFoundError when the campaign does not exist", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(null),
      acceptJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new AcceptJoinCampaign(mockCampaignService);

    await expect(useCase.execute(joinInput)).rejects.toBeInstanceOf(NotFoundError);
    expect(mockCampaignService.acceptJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw AppError 403 when the caller is not the master", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(baseCampaign),
      acceptJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new AcceptJoinCampaign(mockCampaignService);

    await expect(useCase.execute({ ...joinInput, masterId: "outsider" })).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(mockCampaignService.acceptJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when the user has no pending request", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue({ ...baseCampaign, players_requesting: [] }),
      acceptJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new AcceptJoinCampaign(mockCampaignService);

    await expect(useCase.execute(joinInput)).rejects.toBeInstanceOf(NotFoundError);
    expect(mockCampaignService.acceptJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the user is already a player", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue({
        ...baseCampaign,
        players: ["player-1", "user-2"],
      }),
      acceptJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new AcceptJoinCampaign(mockCampaignService);

    await expect(useCase.execute(joinInput)).rejects.toBeInstanceOf(ConflictError);
    expect(mockCampaignService.acceptJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the campaign is full", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue({
        ...baseCampaign,
        players: ["p1", "p2", "p3", "p4", "p5"],
        maxPlayers: 5,
      }),
      acceptJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new AcceptJoinCampaign(mockCampaignService);

    await expect(useCase.execute(joinInput)).rejects.toBeInstanceOf(ConflictError);
    expect(mockCampaignService.acceptJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError when persistence returns null", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(baseCampaign),
      acceptJoinRequest: vi.fn().mockResolvedValue(null),
    } as unknown as CampaignService;

    const useCase = new AcceptJoinCampaign(mockCampaignService);

    await expect(useCase.execute(joinInput)).rejects.toBeInstanceOf(NotFoundError);
  });
});
