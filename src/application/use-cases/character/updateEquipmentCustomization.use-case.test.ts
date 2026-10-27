import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateEquipmentCustomization from "./updateEquipmentCustomization.use-case";

describe("UpdateEquipmentCustomization", () => {
  let characterServiceMock: {
    updateEquipmentCustomization: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      updateEquipmentCustomization: vi.fn(),
    };
  });

  it("should delegate to characterService.updateEquipmentCustomization", async () => {
    const useCase = new UpdateEquipmentCustomization(characterServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      name: "Filo de Invierno",
    };
    const expected = {
      instanceId: "inst1",
      equipment: [{ instanceId: "inst1", name: "Filo de Invierno" }],
    };
    characterServiceMock.updateEquipmentCustomization.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(characterServiceMock.updateEquipmentCustomization).toHaveBeenCalledWith(input);
  });
});
