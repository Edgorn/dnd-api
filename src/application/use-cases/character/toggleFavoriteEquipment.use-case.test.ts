import { describe, it, expect, vi, beforeEach } from "vitest";
import ToggleFavoriteEquipment from "./toggleFavoriteEquipment.use-case";

describe("ToggleFavoriteEquipment", () => {
  let characterServiceMock: {
    toggleFavoriteEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      toggleFavoriteEquipment: vi.fn(),
    };
  });

  it("should delegate to characterService.toggleFavoriteEquipment", async () => {
    const useCase = new ToggleFavoriteEquipment(characterServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      isFavorite: true,
    };
    const expected = {
      id: "char1",
      instanceId: "inst1",
      isFavorite: true,
    };
    characterServiceMock.toggleFavoriteEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(characterServiceMock.toggleFavoriteEquipment).toHaveBeenCalledWith(input);
  });
});
