import { describe, it, expect, vi, beforeEach } from "vitest";
import BindWeaponBond from "./bindWeaponBond.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("BindWeaponBond", () => {
  let personajeServiceMock: {
    bindWeaponBond: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      bindWeaponBond: vi.fn(),
    };
  });

  it("should delegate to personajeService.bindWeaponBond", async () => {
    const useCase = new BindWeaponBond(personajeServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      isBond: true,
    };
    const expected = {
      completo: { id: "char1" },
      basico: { id: "char1" },
    };
    personajeServiceMock.bindWeaponBond.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.bindWeaponBond).toHaveBeenCalledWith(input);
  });

  it("should propagate ValidationError when the item is not magic", async () => {
    const useCase = new BindWeaponBond(personajeServiceMock as any);
    personajeServiceMock.bindWeaponBond.mockRejectedValue(
      new ValidationError("Solo se puede vincular equipamiento mágico")
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
    const useCase = new BindWeaponBond(personajeServiceMock as any);
    personajeServiceMock.bindWeaponBond.mockRejectedValue(
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
