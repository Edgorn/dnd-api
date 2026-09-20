import { describe, it, expect, vi, beforeEach } from "vitest";
import EquipEquipment from "./equipEquipment.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("EquipEquipment", () => {
  let personajeServiceMock: {
    equipEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      equipEquipment: vi.fn(),
    };
  });

  it("should delegate to personajeService.equipEquipment and return completo and basico", async () => {
    const useCase = new EquipEquipment(personajeServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      equipped: true,
    };
    const expected = {
      completo: { id: "char1", CA: 14 },
      basico: { id: "char1", CA: 14 },
    };
    personajeServiceMock.equipEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.equipEquipment).toHaveBeenCalledWith(input);
  });

  it("should propagate NotFoundError when character or equipment is missing", async () => {
    const useCase = new EquipEquipment(personajeServiceMock as any);
    personajeServiceMock.equipEquipment.mockRejectedValue(
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
    const useCase = new EquipEquipment(personajeServiceMock as any);
    personajeServiceMock.equipEquipment.mockRejectedValue(
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
