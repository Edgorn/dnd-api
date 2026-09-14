import { describe, it, expect, vi } from "vitest";
import GetCampaignsByUser from "./getCampaignsByUser.use-case";
import CampaignService from "../../../domain/services/campaign.service";
import { CampaignBasic } from "../../../domain/types/campaign.types";

describe("GetCampaignsByUser UseCase", () => {
  it("should delegate to campaignService.getByUser and return the list", async () => {
    const campaigns: CampaignBasic[] = [
      {
        id: "1",
        name: "Lost Mine",
        isMember: true,
        isMaster: false,
        players: 3,
        status: "Activa",
        master: "Alice",
        system: "dnd5e",
        initialLevel: 1,
        maxPlayers: 5,
        language: "es",
      },
    ];

    const mockCampaignService = {
      getByUser: vi.fn().mockResolvedValue(campaigns),
    } as unknown as CampaignService;

    const useCase = new GetCampaignsByUser(mockCampaignService);
    const result = await useCase.execute("user-1");

    expect(mockCampaignService.getByUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual(campaigns);
  });
});
