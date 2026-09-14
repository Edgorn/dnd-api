import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import GetCampaignById from "./getCampaignById.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignApi, CampaignMongo } from "../../../domain/types/campaign.types";

const campaign: CampaignMongo = {
  _id: new Types.ObjectId(),
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
  locations: [],
  initialMapId: "",
  deletedAt: null,
};

const campaignApi: CampaignApi = {
  id: campaign._id.toString(),
  name: campaign.name,
  description: campaign.description,
  isMaster: false,
  players_requesting: [],
  players: [{ id: "player-1", name: "Bob" }],
  characters: [],
  master: "Alice",
  status: campaign.status,
  system: {
    id: campaign.system,
    name: "D&D 5e",
    description: "Fifth Edition",
  },
  initialLevel: campaign.initialLevel,
  maxPlayers: campaign.maxPlayers,
  language: campaign.language,
  locations: [],
  initialMapId: "",
};

describe("GetCampaignById UseCase", () => {
  it("should return campaign detail when the user is a member", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(campaign),
      getDetail: vi.fn().mockResolvedValue(campaignApi),
    } as unknown as CampaignService;

    const useCase = new GetCampaignById(mockCampaignService);
    const result = await useCase.execute("player-1", campaign._id.toString());

    expect(mockCampaignService.findActiveById).toHaveBeenCalledWith(campaign._id.toString());
    expect(mockCampaignService.getDetail).toHaveBeenCalledWith("player-1", campaign);
    expect(result).toEqual(campaignApi);
  });

  it("should return campaign detail when the user is the master", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(campaign),
      getDetail: vi.fn().mockResolvedValue({ ...campaignApi, isMaster: true }),
    } as unknown as CampaignService;

    const useCase = new GetCampaignById(mockCampaignService);
    const result = await useCase.execute("master-1", campaign._id.toString());

    expect(mockCampaignService.getDetail).toHaveBeenCalledWith("master-1", campaign);
    expect(result.isMaster).toBe(true);
  });

  it("should throw NotFoundError when the campaign does not exist", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(null),
      getDetail: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new GetCampaignById(mockCampaignService);

    await expect(useCase.execute("user-1", "missing-id")).rejects.toBeInstanceOf(NotFoundError);
    expect(mockCampaignService.getDetail).not.toHaveBeenCalled();
  });

  it("should throw AppError 403 when the user is not a member", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(campaign),
      getDetail: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new GetCampaignById(mockCampaignService);

    await expect(useCase.execute("outsider", campaign._id.toString())).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(mockCampaignService.getDetail).not.toHaveBeenCalled();
  });
});
