import { describe, it, expect, vi, beforeEach } from "vitest";
import GetLevelUpData from "./getLevelUpData.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("GetLevelUpData", () => {
  let characterServiceMock: {
    getLevelUpData: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      getLevelUpData: vi.fn(),
    };
  });

  it("should delegate to characterService.getLevelUpData", async () => {
    const useCase = new GetLevelUpData(characterServiceMock as any);
    const expected = {
      class: "class1",
      hitDie: 8,
      proficiencyBonus: 2,
      traits: [],
      traitsData: {},
      spellChoices: [{ choose: 1, options: [], query_type: "filter", query_filter: { level: 0 } }],
      abilityScore: false,
    };
    characterServiceMock.getLevelUpData.mockResolvedValue(expected);

    const result = await useCase.execute("char1", "class1", "user1");

    expect(characterServiceMock.getLevelUpData).toHaveBeenCalledWith("char1", "class1", "user1");
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new GetLevelUpData(characterServiceMock as any);
    characterServiceMock.getLevelUpData.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute("char1", "class1", "user1")).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when user cannot access the character", async () => {
    const useCase = new GetLevelUpData(characterServiceMock as any);
    characterServiceMock.getLevelUpData.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute("char1", "class1", "user2")).rejects.toThrow(AppError);
    await expect(useCase.execute("char1", "class1", "user2")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
