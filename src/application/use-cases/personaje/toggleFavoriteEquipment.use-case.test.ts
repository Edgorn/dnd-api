import { describe, it, expect, vi, beforeEach } from "vitest";
import ToggleFavoriteEquipment from "./toggleFavoriteEquipment.use-case";

describe("ToggleFavoriteEquipment", () => {
  let personajeServiceMock: {
    toggleFavoriteEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      toggleFavoriteEquipment: vi.fn(),
    };
  });

  it("should delegate to personajeService.toggleFavoriteEquipment", async () => {
    const useCase = new ToggleFavoriteEquipment(personajeServiceMock as any);
    const input = {
      id: "char1",
      equip: "eq1",
      isMagic: false,
      isBond: false,
      isFavorite: true,
    };
    const expected = {
      id: "char1",
      equip: "eq1",
      isMagic: false,
      isBond: false,
      isFavorite: true,
    };
    personajeServiceMock.toggleFavoriteEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.toggleFavoriteEquipment).toHaveBeenCalledWith(input);
  });
});
