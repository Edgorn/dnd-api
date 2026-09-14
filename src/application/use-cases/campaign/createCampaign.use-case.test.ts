import { describe, it, expect, vi } from "vitest";
import CreateCampaign from "./createCampaign.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import { AppError } from "../../../domain/errors/AppError";
import { CampaignBasic, CreateCampaignInput } from "../../../domain/types/campaign.types";

const input: CreateCampaignInput = {
  name: "Lost Mine",
  description: "A mining adventure",
  master: "master-1",
  system: "64b1c2d3e4f5a6b7c8d9e0f1",
  initialLevel: 1,
  maxPlayers: 5,
  language: "es",
};

const campaignBasic: CampaignBasic = {
  id: "64b1c2d3e4f5a6b7c8d9e0f2",
  name: input.name,
  isMember: false,
  isMaster: true,
  players: 0,
  status: "Activa",
  master: "Alice",
  system: {
    id: input.system,
    name: "D&D 5e",
    description: "Fifth Edition",
  },
  initialLevel: input.initialLevel,
  maxPlayers: input.maxPlayers,
  language: input.language,
};

describe("CreateCampaign UseCase", () => {
  it("should create a campaign when the service returns data", async () => {
    const mockCampaignService = {
      create: vi.fn().mockResolvedValue(campaignBasic),
    } as unknown as CampaignService;

    const useCase = new CreateCampaign(mockCampaignService);
    const result = await useCase.execute(input);

    expect(mockCampaignService.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(campaignBasic);
  });

  it("should throw AppError when the service returns null", async () => {
    const mockCampaignService = {
      create: vi.fn().mockResolvedValue(null),
    } as unknown as CampaignService;

    const useCase = new CreateCampaign(mockCampaignService);

    await expect(useCase.execute(input)).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 500
    );
  });
});
