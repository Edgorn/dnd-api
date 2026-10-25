import { describe, it, expect, vi, beforeEach } from "vitest";
import EquipEquipment from "./equipEquipment.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("EquipEquipment", () => {
  let characterServiceMock: {
    equipEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      equipEquipment: vi.fn(),
    };
  });

  it("should delegate to characterService.equipEquipment and return full and basic", async () => {
    const useCase = new EquipEquipment(characterServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      equipped: true,
    };
    const expected = {
      full: { id: "char1", ac: 14 },
      basic: { id: "char1", ac: 14 },
    };
    characterServiceMock.equipEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(characterServiceMock.equipEquipment).toHaveBeenCalledWith(input);
  });

  it("should propagate NotFoundError when character or equipment is missing", async () => {
    const useCase = new EquipEquipment(characterServiceMock as any);
    characterServiceMock.equipEquipment.mockRejectedValue(
      new NotFoundError("No se encontró el equipamiento en el personaje")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
        equipped: true,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("should propagate ValidationError when equipment has no equipSlot", async () => {
    const useCase = new EquipEquipment(characterServiceMock as any);
    characterServiceMock.equipEquipment.mockRejectedValue(
      new ValidationError("El equipamiento no tiene ranura de equipamiento (equipSlot)")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
        equipped: true,
      })
    ).rejects.toThrow(ValidationError);
  });
});
