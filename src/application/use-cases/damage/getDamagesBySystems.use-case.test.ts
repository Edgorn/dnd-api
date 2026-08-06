import { describe, it, expect, vi } from "vitest";
import GetDamagesBySystems from "./getDamagesBySystems.use-case";
import DamageService from "../../../domain/services/damage.service";

describe("GetDamagesBySystems UseCase", () => {
  it("should return damages excluding deletedAt field", async () => {
    const mockDamageService = {
      getBySystems: vi.fn().mockResolvedValue([
        {
          id: "1",
          name: "Fuego",
          description: "Daño de fuego",
          color: "#ff0000",
          ruleset: "dnd5e",
          deletedAt: null,
        },
      ]),
    } as unknown as DamageService;

    const useCase = new GetDamagesBySystems(mockDamageService);
    const result = await useCase.execute(["dnd5e"]);

    expect(mockDamageService.getBySystems).toHaveBeenCalledWith(["dnd5e"]);
    expect(result).toEqual([
      {
        id: "1",
        name: "Fuego",
        description: "Daño de fuego",
        color: "#ff0000",
        ruleset: "dnd5e",
      },
    ]);
  });
});
