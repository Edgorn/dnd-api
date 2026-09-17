import { describe, it, expect, vi } from "vitest";
import GetFeatsBySystems from "./getFeatsBySystems.use-case";
import FeatService from "../../../domain/services/feat.service";
import { FeatApi } from "../../../domain/types/feat.types";

const feats: FeatApi[] = [
  {
    id: "feat-1",
    name: "Alert",
    description: ["You cannot be surprised."],
    summary: ["Cannot be surprised"],
    ruleset: "system-1",
    requirements: { attributeMode: "all", attributes: [] },
    deletedAt: null
  }
];

describe("GetFeatsBySystems UseCase", () => {
  it("should return feats for the given systems and user", async () => {
    const mockFeatService = {
      getBySystems: vi.fn().mockResolvedValue(feats)
    } as unknown as FeatService;

    const useCase = new GetFeatsBySystems(mockFeatService);
    const result = await useCase.execute(["system-1"], "user-1");

    expect(mockFeatService.getBySystems).toHaveBeenCalledWith(["system-1"], "user-1");
    expect(result).toEqual(feats);
  });
});
