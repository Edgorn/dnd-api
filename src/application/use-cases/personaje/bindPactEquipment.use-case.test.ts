import { describe, it, expect, vi, beforeEach } from "vitest";
import BindPactEquipment from "./bindPactEquipment.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("BindPactEquipment", () => {
  let personajeServiceMock: {
    bindPactEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      bindPactEquipment: vi.fn(),
    };
  });

  it("should delegate to personajeService.bindPactEquipment", async () => {
    const useCase = new BindPactEquipment(personajeServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      isBond: true,
    };
    const expected = {
      completo: { id: "char1" },
      basico: { id: "char1" },
    };
    personajeServiceMock.bindPactEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.bindPactEquipment).toHaveBeenCalledWith(input);
  });

  it("should propagate ValidationError when the item is not magic", async () => {
    const useCase = new BindPactEquipment(personajeServiceMock as any);
    personajeServiceMock.bindPactEquipment.mockRejectedValue(
      new ValidationError("Solo se puede vincular un pacto con equipamiento mágico")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
        isBond: true,
      })
    ).rejects.toThrow(ValidationError);
  });

  it("should propagate NotFoundError when the instance does not exist", async () => {
    const useCase = new BindPactEquipment(personajeServiceMock as any);
    personajeServiceMock.bindPactEquipment.mockRejectedValue(
      new NotFoundError("No se encontró el equipamiento en el personaje")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
        isBond: false,
      })
    ).rejects.toThrow(NotFoundError);
  });
});
