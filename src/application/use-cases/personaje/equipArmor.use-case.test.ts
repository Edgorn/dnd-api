import { describe, it, expect, vi, beforeEach } from "vitest";
import EquipArmor from "./equipArmor.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("EquipArmor", () => {
  let personajeServiceMock: {
    equiparArmadura: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      equiparArmadura: vi.fn(),
    };
  });

  it("should delegate to personajeService.equiparArmadura and return completo and basico", async () => {
    const useCase = new EquipArmor(personajeServiceMock as any);
    const input = {
      id: "char1",
      equip: "eq1",
      isMagic: false,
      isBond: false,
      equipped: true,
    };
    const expected = {
      completo: { id: "char1", CA: 14 },
      basico: { id: "char1", CA: 14 },
    };
    personajeServiceMock.equiparArmadura.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.equiparArmadura).toHaveBeenCalledWith(input);
  });

  it("should propagate NotFoundError when character or equipment is missing", async () => {
    const useCase = new EquipArmor(personajeServiceMock as any);
    personajeServiceMock.equiparArmadura.mockRejectedValue(
      new NotFoundError("No se encontró el equipamiento en el personaje")
    );

    await expect(
      useCase.execute({
        id: "char1",
        equip: "eq1",
        isMagic: false,
        isBond: false,
        equipped: true,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("should propagate ValidationError when equipment has no equipSlot", async () => {
    const useCase = new EquipArmor(personajeServiceMock as any);
    personajeServiceMock.equiparArmadura.mockRejectedValue(
      new ValidationError("El equipamiento no tiene ranura de equipamiento (equipSlot)")
    );

    await expect(
      useCase.execute({
        id: "char1",
        equip: "eq1",
        isMagic: false,
        isBond: false,
        equipped: true,
      })
    ).rejects.toThrow(ValidationError);
  });
});
