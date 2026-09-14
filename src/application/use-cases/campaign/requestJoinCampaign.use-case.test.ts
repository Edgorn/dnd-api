import { describe, it, expect, vi } from "vitest";
import { Types } from "mongoose";
import RequestJoinCampaign from "./requestJoinCampaign.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import { ConflictError, NotFoundError } from "../../../domain/errors/AppError";
import { CampaignBasic, CampaignMongo } from "../../../domain/types/campaign.types";

const baseCampaign: CampaignMongo = {
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

const campaignBasic: CampaignBasic = {
  id: baseCampaign._id.toString(),
  name: baseCampaign.name,
  isMember: false,
  isMaster: false,
  players: 1,
  status: baseCampaign.status,
  master: "Alice",
  system: {
    id: baseCampaign.system,
    name: "D&D 5e",
    description: "Fifth Edition",
  },
  initialLevel: baseCampaign.initialLevel,
  maxPlayers: baseCampaign.maxPlayers,
  language: baseCampaign.language,
};

describe("RequestJoinCampaign UseCase", () => {
  it("should register a join request when the user can join", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(baseCampaign),
      registerJoinRequest: vi.fn().mockResolvedValue(campaignBasic),
    } as unknown as CampaignService;

    const useCase = new RequestJoinCampaign(mockCampaignService);
    const result = await useCase.execute("user-2", baseCampaign._id.toString());

    expect(mockCampaignService.findActiveById).toHaveBeenCalledWith(baseCampaign._id.toString());
    expect(mockCampaignService.registerJoinRequest).toHaveBeenCalledWith("user-2", baseCampaign._id.toString());
    expect(result).toEqual(campaignBasic);
  });

  it("should throw NotFoundError when the campaign does not exist", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(null),
      registerJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new RequestJoinCampaign(mockCampaignService);

    await expect(useCase.execute("user-2", "missing-id")).rejects.toBeInstanceOf(NotFoundError);
    expect(mockCampaignService.registerJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the user already requested to join", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue({ ...baseCampaign, players_requesting: ["user-2"] }),
      registerJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new RequestJoinCampaign(mockCampaignService);

    await expect(useCase.execute("user-2", baseCampaign._id.toString())).rejects.toBeInstanceOf(ConflictError);
    expect(mockCampaignService.registerJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the user is already a player", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(baseCampaign),
      registerJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new RequestJoinCampaign(mockCampaignService);

    await expect(useCase.execute("player-1", baseCampaign._id.toString())).rejects.toBeInstanceOf(ConflictError);
    expect(mockCampaignService.registerJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the user is the master", async () => {
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(baseCampaign),
      registerJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new RequestJoinCampaign(mockCampaignService);

    await expect(useCase.execute("master-1", baseCampaign._id.toString())).rejects.toBeInstanceOf(ConflictError);
    expect(mockCampaignService.registerJoinRequest).not.toHaveBeenCalled();
  });

  it("should throw ConflictError when the campaign is full", async () => {
    const fullCampaign = { ...baseCampaign, players: ["p1", "p2", "p3", "p4", "p5"], maxPlayers: 5 };
    const mockCampaignService = {
      findActiveById: vi.fn().mockResolvedValue(fullCampaign),
      registerJoinRequest: vi.fn(),
    } as unknown as CampaignService;

    const useCase = new RequestJoinCampaign(mockCampaignService);

    await expect(useCase.execute("user-2", baseCampaign._id.toString())).rejects.toBeInstanceOf(ConflictError);
    expect(mockCampaignService.registerJoinRequest).not.toHaveBeenCalled();
  });
});
